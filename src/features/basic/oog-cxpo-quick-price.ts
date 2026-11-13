import { setQuickPriceEnabled } from './cxpo-order-book/quick-price';

function init() {
  setQuickPriceEnabled(true);
}

features.add(import.meta.url, init, 'CXPO：在订单簿中显示参考价格行，快速压低卖价或提高买价');
