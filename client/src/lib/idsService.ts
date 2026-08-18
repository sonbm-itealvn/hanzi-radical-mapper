let idsMapping: Record<string, string> | null = null;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

export async function loadIdsMapping() {
  if (idsMapping) return;
  if (isLoading && loadPromise) return loadPromise;

  isLoading = true;
  loadPromise = fetch('/ids.json')
    .then((res) => res.json())
    .then((data) => {
      idsMapping = data;
    })
    .catch((err) => {
      console.error("Failed to load IDS mapping:", err);
      idsMapping = {};
    })
    .finally(() => {
      isLoading = false;
    });

  return loadPromise;
}

export function getIdsString(char: string): string | null {
  if (!idsMapping) return null;
  return idsMapping[char] || null;
}

export function parseIds(char: string, radical: string) {
  const idsString = getIdsString(char);
  if (!idsString) return null;

  // Cấu trúc ký hiệu:
  // ⿰ Trái phải, ⿱ Trên dưới, ⿲ Trái giữa phải, ⿳ Trên giữa dưới, ⿴ Bao quanh toàn bộ, 
  // ⿵ Bao quanh mở dưới, ⿶ Bao quanh mở trên, ⿷ Bao quanh mở phải, ⿸ Góc trái trên, 
  // ⿹ Góc phải trên, ⿺ Góc trái dưới, ⿻ Lồng nhau
  
  const structureMap: Record<string, string> = {
    '⿰': 'Trái – phải',
    '⿱': 'Trên – dưới',
    '⿲': 'Trái – giữa – phải',
    '⿳': 'Trên – giữa – dưới',
    '⿴': 'Bao quanh',
    '⿵': 'Bao quanh (mở dưới)',
    '⿶': 'Bao quanh (mở trên)',
    '⿷': 'Bao quanh (mở phải)',
    '⿸': 'Góc trái trên',
    '⿹': 'Góc phải trên',
    '⿺': 'Góc trái dưới',
    '⿻': 'Lồng nhau'
  };

  const firstChar = idsString.charAt(0);
  const structureName = structureMap[firstChar] || 'Chưa rõ cấu trúc';

  // Lọc bỏ các ký tự cấu trúc để lấy phần còn lại
  const idsChars = /[⿰⿱⿲⿳⿴⿵⿶⿷⿸⿹⿺⿻]/g;
  const components = idsString.replace(idsChars, '');
  
  let remaining = components;
  // Xóa bộ thủ khỏi chuỗi các thành phần nếu bộ thủ khớp chính xác
  // Lưu ý: Đôi khi bộ thủ dạng biến thể (ví dụ 亻 thay vì 人) sẽ không có sẵn trong chuỗi trừ khi IDS ghi rõ.
  if (remaining.includes(radical)) {
    remaining = remaining.replace(radical, '');
  }

  // Nếu remaining trống, nghĩa là chữ này bản thân là bộ thủ
  if (!remaining) {
    remaining = '—';
  }

  return {
    structure: structureName,
    remaining
  };
}
