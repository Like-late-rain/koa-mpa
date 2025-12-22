import type { IApi, IData } from "@/interface/IApi";

class ApiService implements IApi {
  getInfo(): Promise<IData> {
    return new Promise((resolve) => {
      resolve({ status: "奥利给加油！！！！！", result: [1, 2, 3] });
    });
  }
}

export default ApiService;
