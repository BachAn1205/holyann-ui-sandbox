const str1 = "Phân b? th?i gian (level=1) chua h?p lý";
const str2 = "Ð? liên quan (relevant_ratio = 0.0)";
const str3 = "C?u trúc (structure_hierarchy level = 1)";
const str4 = "Cân nh?c (score=10)";
const regex = /\s*\([^()]*\b(?:level|relevant_ratio|structure_hierarchy|score|ratio|score_tier)\b[^()]*\)/gi;
[str1, str2, str3, str4].forEach(s => console.log(s.replace(regex, "")));
