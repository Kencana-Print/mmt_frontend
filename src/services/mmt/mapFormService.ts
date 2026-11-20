import api from "@/services/api";

const BASE_URL = "/mmt/map";

export const mapFormService = {
  getInitGrids() {
    return api.get(`${BASE_URL}/init-grids`);
  },

  getSpkInformasi(divisi: string) {
    return api.get(
      `${BASE_URL}/spk-informasi/${encodeURIComponent(divisi)}`,
    );
  },

  loadMintaHarga(nomorMh: string) {
    return api.get(
      `${BASE_URL}/minta-harga/${encodeURIComponent(nomorMh)}`,
    );
  },

  getNamaSuggestions: (q: string, divisi: string, cusKode: string) =>
    api.get(`${BASE_URL}/suggestions/nama`, {
      params: { q, divisi, cusKode },
    }),

  checkDuplikatNama: (
    nama: string,
    divisi: string,
    cusKode: string,
    excludeNomor = "",
  ) =>
    api.get(`${BASE_URL}/check-duplikat`, {
      params: { nama, divisi, cusKode, excludeNomor },
    }),

  getKatalogCustomer(
    cusKode: string,
    divisi: string = "",
    keyword: string = "",
    page: number = 1,
    limit: number = 20,
  ) {
    return api.get(`${BASE_URL}/katalog-customer/${encodeURIComponent(cusKode)}`, {
      params: { divisi, q: keyword, page, limit },
    });
  },

  searchLhkDesain: (q: string = "") =>
    api.get(`${BASE_URL}/design/list`, { params: { q } }),

  getById(nomor: string) {
    const safeNomor = encodeURIComponent(nomor);
    return api.get(`${BASE_URL}/${safeNomor}`);
  },

  save(data: any, isNewMode: boolean) {
    return api.post(BASE_URL, { ...data, isNewMode });
  },

  uploadGambar(
    file: File,
    mapNomor: string,
    cabang: string,
    type: "MAIN" | "PO" | "ACC",
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("cabang", cabang);
    formData.append("type", type);

    return api.post(
      `${BASE_URL}/${encodeURIComponent(mapNomor)}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },

  clearPenawaran: (nomor: string) =>
    api.patch(`${BASE_URL}/${encodeURIComponent(nomor)}/clear-penawaran`),
};

export default mapFormService;
