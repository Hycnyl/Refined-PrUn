function onTileReady(tile: PrunTile) {
  // Replace 'view details/vote' with 'vote'
  subscribe($$(tile.anchor, C.Button.darkInline), button => {
    button.textContent = 'vote';
  });

  // Remove redundant title parts
  subscribe($$(tile.anchor, C.Link.link), link => {
    if (link.textContent) {
      link.textContent = link
        .textContent!.replace('Advertising Campaign: ', '')
        .replace('Education Events: ', '');
    }
  });
}

function init() {
  tiles.observe('COGCPEX', onTileReady);
}

features.add(
  import.meta.url,
  init,
  'COGCPEX：隐藏活动标签中的“Advertising Campaign:”和“Education Events:”',
);
