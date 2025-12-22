export type IData = {
  status: string;
  result?: Array<number | string>;
};

export interface IApi {
  getInfo(): Promise<IData>;
}
