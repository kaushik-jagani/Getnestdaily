// Wraps every <table> in <div class="table-scroll-wrap"> for horizontal scroll.
// No external dependencies needed.
function wrapTables(node) {
  if (!node.children) return;
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.type === 'element' && child.tagName === 'table') {
      node.children[i] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll-wrap'] },
        children: [child],
      };
    } else {
      wrapTables(child);
    }
  }
}

export default function rehypeTableWrap() {
  return (tree) => wrapTables(tree);
}