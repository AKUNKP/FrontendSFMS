export const getDashboardStats = () => [
  {
    title: "Total Nasabah Hari Ini",
    value: "342",
    note: "Puncak kedatangan 11:00",
    accent: "from-sky-50 via-white to-white",
    tone: "sky",
  },
  {
    title: "Rata-rata Waktu Layanan",
    value: "04m 12s",
    note: "Di bawah SLA 5 menit",
    accent: "from-emerald-50 via-white to-white",
    tone: "emerald",
  },
  {
    title: "Smile Score AI",
    value: "88%",
    note: "Stabil sepanjang shift",
    accent: "from-amber-50 via-white to-white",
    tone: "amber",
  },
  {
    title: "Teller Aktif",
    value: "8/10",
    note: "2 teller standby",
    accent: "from-purple-50 via-white to-white",
    tone: "purple",
  },
];

export const getChartData = () => ({
  labels: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"],
  volume: [82, 124, 155, 142, 176, 198, 184, 160],
  busy: [46, 68, 92, 88, 120, 136, 126, 98],
});

export const getInsights = () => ({
  operational: "Prediksi lonjakan nasabah pada pukul 14:30, disarankan membuka 2 counter tambahan.",
  interaction: "Sistem mendeteksi tren positif pada kualitas layanan hari ini dengan rata-rata senyum yang stabil.",
});

export const getTellers = () => [
  { id: 1, name: "Intan Yuliana", username: "intan.y", active: true },
  { id: 2, name: "Rafi Pratama", username: "rafi.p", active: true },
  { id: 3, name: "Mega Kartika", username: "mega.k", active: false },
  { id: 4, name: "Bayu Aditya", username: "bayu.a", active: true },
  { id: 5, name: "Nina Mahendra", username: "nina.m", active: true },
];
