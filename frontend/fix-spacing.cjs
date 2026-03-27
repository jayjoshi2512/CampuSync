const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules')) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('d:/_Projects/____________/frontend/src');
let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 4 values
  content = content.replace(/p-\[([a-z0-9\.\-%]+)_([a-z0-9\.\-%]+)_([a-z0-9\.\-%]+)_([a-z0-9\.\-%]+)\]/g, 'pt-[$1] pr-[$2] pb-[$3] pl-[$4]');
  content = content.replace(/m-\[([a-z0-9\.\-%]+)_([a-z0-9\.\-%]+)_([a-z0-9\.\-%]+)_([a-z0-9\.\-%]+)\]/g, 'mt-[$1] mr-[$2] mb-[$3] ml-[$4]');
  // 3 values
  content = content.replace(/p-\[([a-z0-9\.\-%]+)_([a-z0-9\.\-%]+)_([a-z0-9\.\-%]+)\]/g, 'pt-[$1] px-[$2] pb-[$3]');
  content = content.replace(/m-\[([a-z0-9\.\-%]+)_([a-z0-9\.\-%]+)_([a-z0-9\.\-%]+)\]/g, 'mt-[$1] mx-[$2] mb-[$3]');
  // 2 values
  content = content.replace(/p-\[([a-z0-9\.\-%]+)_([a-z0-9\.\-%]+)\]/g, 'py-[$1] px-[$2]');
  content = content.replace(/m-\[([a-z0-9\.\-%]+)_([a-z0-9\.\-%]+)\]/g, 'my-[$1] mx-[$2]');
  // gap 2 values
  content = content.replace(/gap-\[([a-z0-9\.\-%]+)_([a-z0-9\.\-%]+)\]/g, 'gap-y-[$1] gap-x-[$2]');
  // rounded 4 values
  content = content.replace(/rounded-\[([a-z0-9\.\-%]+)_([a-z0-9\.\-%]+)_([a-z0-9\.\-%]+)_([a-z0-9\.\-%]+)\]/g, 'rounded-tl-[$1] rounded-tr-[$2] rounded-br-[$3] rounded-bl-[$4]');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', path.basename(file));
    count++;
  }
});

console.log(`Successfully fixed ${count} files.`);
