// cleanSvgFile.js
// import fs from 'fs';
// import path from 'path';
import { DOMParser, XMLSerializer } from 'xmldom';
import opentype from 'opentype.js';

/**
 * Remove HTML comments (<!-- ... -->) using a regex.
 * @param {string} text
 * @returns {string}
 */
function removeHtmlComments(text) {
  // Regex to remove any <!-- comment -->
  text =  text.replace(/<!--[\s\S]*?-->/g, '');
//   text = text.replace('<rect class="SVGPart.*?/>', '')
  text = text.replace(/<rect[^>]*\/?>/g, '');
  return text;
}

/**
 * Convert <polygon ... /> tags to <path ... /> tags using a regex.
 * @param {string} svgContent
 * @returns {string} Updated SVG content with polygons replaced by paths
 */
function convertPolygonToPath(svgContent) {
  const polygonPattern = /<polygon([^>]*)\/>/g;

  return svgContent.replace(polygonPattern, (match, attrs) => {
    // 1. Extract points="..."
    const pointsMatch = /points="([^"]+)"/.exec(attrs);
    if (!pointsMatch) {
      return match; // If no 'points' attribute, keep original
    }

    const rawPoints = pointsMatch[1].trim();
    // Clean up any extra commas/spaces
    // e.g. "100,200 150,250" => M 100,200 L 150,250 Z
    // If you need more robust parsing, adjust accordingly
    const cleanedPoints = rawPoints
      .replace(/,\s+/g, ',') // remove space after commas
      .split(/\s+/)          // split on spaces
      .map(p => p.replace(/,$/, '')); // remove trailing comma if any

    const pathData = `M ${cleanedPoints.join(' L ')} Z`;

    // 2. Extract style="..."
    const styleMatch = /style="([^"]+)"/.exec(attrs);
    const style = styleMatch ? styleMatch[1].trim() : '';

    // Rebuild as <path ... />
    let pathElement = `<path d="${pathData}"`;
    if (style) {
      pathElement += ` style="${style}"`;
    }
    pathElement += ' />';

    return pathElement;
  });
}

/**
 * Convert a single glyph (by name) to an SVG path string, scaled to `fontSize`.
 *
 * This replicates the idea of drawing into a pen, but in JS we
 * typically rely on `opentype.js` to get the path data directly.
 */
function glyphToPath(glyph, font, fontSize) {
  // `glyph.getPath` returns a set of commands (M, L, C, Q, Z) for the glyph
  const path = glyph.getPath(0, 0, fontSize);

  // Convert the glyphPath.commands into a single string for the "d" attribute
  let pathData = '';
  for (const cmd of path.commands) {
    if (cmd.type === 'M') {
      pathData += `M ${cmd.x} ${cmd.y} `;
    } else if (cmd.type === 'L') {
      pathData += `L ${cmd.x} ${cmd.y} `;
    } else if (cmd.type === 'C') {
      pathData += `C ${cmd.x1} ${cmd.y1}, ${cmd.x2} ${cmd.y2}, ${cmd.x} ${cmd.y} `;
    } else if (cmd.type === 'Q') {
      pathData += `Q ${cmd.x1} ${cmd.y1}, ${cmd.x} ${cmd.y} `;
    } else if (cmd.type === 'Z') {
      pathData += 'Z ';
    }
  }
  return pathData.trim();
}

/**
 * Naively convert a string of text into multiple <path> data strings.
 * Essentially draws each glyph next to the previous one, ignoring kerning.
 *
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {string} fontPath
 * @param {number} fontSize
 * @returns {Promise<Array<{d:string, transform:string}>>}
 */
async function textToPaths(text, x, y, fontPath, fontSize, textPosition) {
  const font = await opentype.load(fontPath);
  let currentX = textPosition === true ? x - 22: x;

  const pathInfos = [];
  for (const char of text) {
    // Convert character to a glyph
    const glyph = font.charToGlyph(char);

    // Build the path data for this glyph at (0, 0)
    const pathData = glyphToPath(glyph, font, fontSize);

    // Collect the path + transform
    pathInfos.push({
      d: pathData,
      transform: `translate(${currentX}, ${y})`
    });

    // Advance naive "currentX" by the scaled width of this glyph
    const unitsPerEm = font.unitsPerEm;
    const scale = fontSize / unitsPerEm;
    currentX += glyph.advanceWidth * scale;
  }

  return pathInfos;
}


async function convertText(svgContent){
  // 1. Parse SVG with xmldom
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(svgContent, 'image/svg+xml');
  // const svgDoc = await loadSvg(svgContent);
  const svgRoot = doc.documentElement;

  // Example: remove nested <svg> if inside <g id="SVGUse">
  const gWithIdSVGUse = svgRoot.getElementsByTagName('g');
  for (let i = 0; i < gWithIdSVGUse.length; i++) {
    const gTag = gWithIdSVGUse[i];
    // If the ID is 'SVGUse'
    if (gTag.getAttribute('ID') === 'SVGUse') {
      // Unwrap any nested <svg> tags
      const nestedSvgs = gTag.getElementsByTagName('svg');
      // Because live NodeList, gather them first
      const toUnwrap = [];
      for (let n = 0; n < nestedSvgs.length; n++) {
        toUnwrap.push(nestedSvgs[n]);
      }
      for (const svgTag of toUnwrap) {
        // Remove the <svg> but keep its children
        while (svgTag.firstChild) {
          gTag.insertBefore(svgTag.firstChild, svgTag);
        }
        gTag.removeChild(svgTag);
      }
    }
  }

  const gTags = svgRoot.getElementsByTagName('g');
  const second_g = gTags[1]; // Get the second <g> tag (index 1)

  if (second_g) {
      const currentTransform = second_g.getAttribute('transform') || '';
      
      // Define the new scale value
      const newScale = 'scale(1)'; // Adjust this value as needed

      // Replace the existing scale in the current transform
      const newTransform = currentTransform.replace(/scale\([^)]*\)/, newScale);

      // Set the new transform attribute
      second_g.setAttribute('transform', newTransform);
  }


  const toRemove = []; // We'll collect <g> tags to remove after we process them

  for (let i = 0; i < gTags.length; i++) {
    const gTag = gTags[i];
    const texts = gTag.getElementsByTagName('text');
    if (texts.length > 0) {
      const textElem = texts[0]; // handle the first <text> found
      const xAttr = textElem.getAttribute('x') || '0';
      const yAttr = textElem.getAttribute('y') || '0';
      const textContent = textElem.textContent || '';

      // Some default styling
      let fontSize = 12;
      let fontFamily = 'Arial';
      let fontColor = 'black';
      let textPostion = false;
      // If there's style on the <g>, parse it for font-family, font-size, fill, etc.
      const gStyle = gTag.getAttribute('style');      
      if(gStyle)
      {
        const styles = gStyle.split(';').map(s => s.trim());

        for (const s of styles) {
            const [key, val] = s.split(':').map(part => part.trim().toLowerCase());
            if (!key || !val) continue;

            if (key === 'font-size') {
            // e.g. "12px" => parse 12
            const num = parseFloat(val);
            // The Python code multiplied by 4/3 if it sees "px"; replicate if needed
            if (val.endsWith('px')) {
                fontSize = num;
            } else {
                fontSize = num * (4.0 / 3.0);
            }
            } else if (key === 'fill') {
            fontColor = val;
            } else if (key === 'font-family') {
            fontFamily = val.replace(/['"]/g, ''); // remove quotes if any
            }
            else if(key === 'text-anchor')
            {
              textPostion = true;
            }
        }
        // Build path from text
        // Adjust to your actual font path (e.g. './arial/ARIAL.TTF')
        const fontPath = './ARIAL.TTF';

        // Convert text => paths
        let pathInfos = [];
        try {
            pathInfos = await textToPaths(
            textContent,
            parseFloat(xAttr),
            parseFloat(yAttr),
            fontPath,
            fontSize,
            textPostion
            );
        } catch (err) {
            console.error('Error loading or processing font:', err);
            continue;
        }

        // Insert new <path> elements before the <g>
        const parentNode = gTag.parentNode;
        for (const info of pathInfos) {
            if (!info.d) continue;

            // Create <path> node
            const pathNode = doc.createElement('path');
            pathNode.setAttribute('d', info.d);
            pathNode.setAttribute('transform', info.transform);
            pathNode.setAttribute('fill', fontColor);
            pathNode.setAttribute('stroke', fontColor);
            parentNode.insertBefore(pathNode, gTag);
        }
        // Mark <g> for removal
        toRemove.push(gTag);
        }
      }      
  }
  // Remove the old <g> elements (and their children)
  for (const g of toRemove) {
    if (g.parentNode) {
      g.parentNode.removeChild(g);
    }
  }
  // 7. Serialize the DOM back to string
  const xmlSerializer = new XMLSerializer();
  const outputSvg = xmlSerializer.serializeToString(doc);
  console.log(outputSvg);
  return outputSvg;
}

async function changeScale(svgContent) 
{
  // 1. Parse SVG with xmldom
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(svgContent, 'image/svg+xml');
  // const svgDoc = await loadSvg(svgContent);
  const svgRoot = doc.documentElement;

  // 2. Find all <g> that contain <text>
  const gTags = svgRoot.getElementsByTagName('g');
  // const first_g = gTags[0]; // Get the second <g> tag (index 1)

  // if (first_g) {
  //     const currentTransform = first_g.getAttribute('transform') || '';
      
  //     // Define the new scale value
  //     const newScale = 'scale(0.05)'; // Adjust this value as needed

  //     // Replace the existing scale in the current transform
  //     const newTransform = currentTransform.replace(/scale\([^)]*\)/, newScale);

  //     // Set the new transform attribute
  //     first_g.setAttribute('transform', newTransform);
  // }
  const second_g = gTags[1]; // Get the second <g> tag (index 1)

  if (second_g) {
      const currentTransform = second_g.getAttribute('transform') || '';
      
      // Define the new scale value
      const newScale = 'scale(1)'; // Adjust this value as needed

      // Replace the existing scale in the current transform
      const newTransform = currentTransform.replace(/scale\([^)]*\)/, newScale);

      // Set the new transform attribute
      second_g.setAttribute('transform', newTransform);
  }
  const xmlSerializer = new XMLSerializer();
  const outputSvg = xmlSerializer.serializeToString(doc);
  console.log(outputSvg);
  return outputSvg;
}

/**
 * Main function to clean an SVG file:
 * 1. Removes comments
 * 2. Converts <polygon> to <path>
 * 3. Parses with DOM to manipulate <g> tags containing <text>
 * 4. Replaces <text> with <path> outlines from a TTF font
 *
 * @param {string} svgContent Path to input SVG
 */

export async function cleanSvgFile(svgContent) {

  // 2. Remove HTML comments
  svgContent = removeHtmlComments(svgContent);

  // 3. Convert <polygon> to <path>
  svgContent = convertPolygonToPath(svgContent);

  // 4. Optionally remove extra whitespace between tags
  //    Here we replace >< with >\n< for readability
  svgContent = svgContent.replace(/>\s+</g, '>\n<');

  // svgContent = changeScale(svgContent);

  // 5 Convert text to Path
  svgContent = convertText(svgContent);

  // // 8. Write output file
  return svgContent;
}
