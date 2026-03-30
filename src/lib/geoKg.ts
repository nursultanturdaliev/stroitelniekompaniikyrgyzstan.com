/** Эвристика города по строке адреса (как в выгрузке elitka). */

export function inferCityFromAddress(address: string): string {
  const a = address.toLowerCase();
  if (a.includes("бишкек") || a.includes("bishkek")) return "Бишкек";
  if (a.includes("ош") && !a.includes("орто")) return "Ош";
  if (a.includes("кант")) return "Кант";
  if (a.includes("токмок")) return "Токмок";
  if (a.includes("каракол")) return "Каракол";
  if (a.includes("орто-сай") || a.includes("орто сай")) return "с. Орто-Сай";
  if (a.includes("беш кунгей") || a.includes("беш-кунгей")) return "с. Беш-Кунгей";
  if (a.includes("кок-джар") || a.includes("кок джар")) return "с. Кок-Джар";
  if (a.includes("джал")) return "Джал";
  return "Бишкек";
}
