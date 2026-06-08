const fs = require('fs');

const files = [
  'src/pages/Checkout.tsx',
  'src/pages/Admin.tsx',
  'src/pages/Menu.tsx',
  'src/components/Aisommelier.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/\.from\('orders'\)/g, ".from('sb_orders')");
    content = content.replace(/\.from\('order_items'\)/g, ".from('sb_order_items')");
    content = content.replace(/\.from\('menus'\)/g, ".from('sb_menus')");
    content = content.replace(/\.from\('tables'\)/g, ".from('sb_tables')");
    content = content.replace(/table: 'orders'/g, "table: 'sb_orders'");
    content = content.replace(/table: 'tables'/g, "table: 'sb_tables'");
    fs.writeFileSync(f, content);
  }
});

console.log('Done');
