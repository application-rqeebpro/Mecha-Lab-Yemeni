/**
 * Official Mechatronics Virtual Lab Student Activation Codes
 * Generated and approved for student enrollment.
 */

export const OFFICIAL_ACTIVATION_CODES: string[] = [
  "M24U4C", "M27PNB", "M29D2L", "M2AGGT", "M2HVF3", "M2LLZ2", "M2UZUG", "M2VMUE", "M32HPR", "M37K58",
  "M3BGGH", "M3J3N6", "M3KDJG", "M3LYHG", "M3SVY4", "M3ZXEX", "M4BGZJ", "M4EEQT", "M4FKRW", "M4H2M4",
  "M4JN4E", "M4MMJS", "M4YMKN", "M4ZGAP", "M5AFMM", "M5EPTY", "M5JY7P", "M5PJ2S", "M5RDFG", "M5S2US",
  "M5U53Q", "M6RZAA", "M6T3L5", "M6V5F5", "M73V4J", "M74JU5", "M74ZK8", "M7AA9U", "M7HXDL", "M7Q5ES",
  "M7SFAR", "M7U4X3", "M84UN7", "M85D2G", "M8655W", "M87DUZ", "M8PVC3", "M8RVT5", "M8TJHQ", "M8Y829",
  "M94MGF", "M9EWLW", "M9LDT5", "M9MCFA", "M9NBAG", "M9XQUT", "MA2QC3", "MAE89Y", "MAKWDM", "MANQEP",
  "MAQJSM", "MAQNAU", "MB4T8A", "MB79EX", "MBGRN5", "MBH2QJ", "MC9NRB", "MCG8DG", "MCHAMN", "MCQLTL",
  "MCQPCU", "MCVYVN", "MCWYCE", "MD22Q2", "MD2DTV", "MDH5S8", "MDH7Z4", "MDQZ92", "MDZ49Z", "ME242Q",
  "ME9WU3", "MEBK9C", "MEE5LW", "MEFQXQ", "MEMAYF", "MEQSFZ", "MF8PDT", "MF9HBW", "MFB2JN", "MFCWBF",
  "MFE5YJ", "MFKMQ4", "MFRUJ6", "MFTN7W", "MFZ4V9", "MG2BPP", "MG9SU6", "MGAQTF", "MGH3FU", "MGJB2F",
  "MGMD5B", "MGMFHT", "MGVRQJ", "MGWX45", "MGX8B4", "MGY8VW", "MGZWF8", "MH5QVJ", "MH947Z", "MHCZJY",
  "MHG2RU", "MHHEFK", "MHMCT6", "MHQ7KB", "MHS25J", "MHSJKN", "MHZVYT", "MJ3EPE", "MJB5VE", "MJFMKP",
  "MJHC3N", "MJPRJ8", "MJQ9ET", "MJTDNA", "MJTRWK", "MKAH4P", "MKHPWL", "ML2KA2", "ML9U7P", "MLACYW",
  "MLAELL", "MLJ9BU", "MLJJC2", "MLMGA9", "MLMY9J", "MLNVYS", "MLPADT", "MLSJ46", "MLTBFB", "MLV5YY",
  "MM53KH", "MM7XT3", "MMCMSB", "MMHHQS", "MMJF8G", "MMTV5V", "MMWYH4", "MN2B4Q", "MNPXSK", "MNQQS6",
  "MNR8SM", "MP568B", "MPBHZY", "MPECHA", "MPPA4W", "MPWG2G", "MPYCS3", "MPYCU4", "MQ2ZCV", "MQ44LV",
  "MQ933J", "MQ9CR5", "MQASQN", "MQJPZM", "MQKA85", "MQN88A", "MQR9EJ", "MQW2W7", "MQY8C2", "MQYW2R",
  "MR6HBA", "MRB5KV", "MRBX6D", "MRFQFD", "MRGZ64", "MRH2UE", "MRQ8QY", "MRSHVK", "MRVTK7", "MRY3NG",
  "MS349R", "MS9GTJ", "MSBA7U", "MSCHD9", "MSLRAF", "MSMK77", "MSQY3Q", "MSTSQS", "MSTU3T", "MSZGJE",
  "MT46R3", "MT6ZVZ", "MT88BE", "MT9APC", "MTEYJC", "MTGHJL", "MTGUMV", "MTMC67", "MTQZ4R", "MTUGLN",
  "MTWCGP", "MTX7KB", "MTY6KX", "MUADHK", "MULEW3", "MULM7D", "MUWMLW", "MUX4R4", "MV5TEP", "MVDW3L",
  "MVJSVY", "MVKV2B", "MVL9UH", "MVQ3WX", "MVSJSZ", "MW5QY4", "MW9X4H", "MW9XEB", "MWDQKK", "MWHMT2",
  "MWSMLB", "MX9V52", "MXC8VN", "MXK3ZA", "MXK6SL", "MXRSSB", "MXWV8A", "MY2T6N", "MYCGAS", "MYLER9",
  "MYTPYP", "MYWPB5", "MZ27N7", "MZ2CM2", "MZ32DA", "MZFEYD", "MZG2BH", "MZHDKP", "MZLEJY", "MZYGJ8"
];

// Normalized uppercase set for instant O(1) lookup
const CODE_SET = new Set(OFFICIAL_ACTIVATION_CODES.map(c => c.toUpperCase()));

/**
 * Checks if a given code is one of the official student activation codes.
 */
export function isValidOfficialCode(code: string): boolean {
  if (!code) return false;
  const clean = code.trim().toUpperCase();
  return CODE_SET.has(clean);
}

/**
 * Normalizes user-entered code.
 */
export function normalizeAccessCode(code: string): string {
  return String(code || '').trim().toUpperCase();
}
