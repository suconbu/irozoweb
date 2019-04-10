/**
 * クエリ文字列をばらばらにします。
 * @return {object} パラメータのKeyValueペア
 */
function parseQueryString() {
  const t = location.search.slice(1);
  return t.split('&').reduce((p, v) => {
    const pair = v.split('=');
    p[pair[0]] = decodeURIComponent(pair[1]);
    return p;
  }, {});
}

/**
 * HTTP要求を出します。
 * @param {string} method 
 * @param {string} uri 
 * @param {callback} okHandler 200番台用の応答ハンドラ
 * @param {callback} nokHandler 200番台以外の応答ハンドラ
 */
function request(method, uri, okHandler) {
  console.log(`request--->: ${method} ${uri}`);
  const request = new XMLHttpRequest();
  request.onreadystatechange = function() {
    if (request.readyState == 4) {
      console.log(`<--response: code:${request.status} data:${request.responseText.slice(0, 100).replace(/[\r\n]/g,"")}`);
      if (200 <= request.status && request.status < 300) {
        okHandler(request.status, request.responseText);
      }
      else {
        nokHandler(request.status, request.responseText);
      }
    }
  }
  request.open(method, uri, true);
  request.send();
}

/**
 * CSS適用後のプロパティ値を取得します。
 * @param {object} element element オブジェクト
 * @param {string} propertyName プロパティ名
 * @return {string} プロパティ値
 */
function getComputedStyleValue(element, propertyName) {
  const style = window.getComputedStyle(element);
  const value = style.getPropertyValue(propertyName);
  return value;
}
