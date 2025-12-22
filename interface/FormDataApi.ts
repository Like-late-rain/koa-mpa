// 定义创建表单数据的请求体
export type CreateFormDataBody = {
  field1: string;
  field2: string;
  userId?: string | null;
};

// 定义更新表单数据的请求体
export type UpdateFormDataBody = {
  field1?: string;
  field2?: string;
};

// 定义表单数据响应体
export type FormDataBody = {
  id: string;
  field1: string;
  field2: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface FormDataApi {
  getAllFormData(): Promise<FormDataBody[]>;
  getFormDataById(id: string): Promise<FormDataBody | null>;
  getFormDataByUserId(userId: string): Promise<FormDataBody[]>;
  createFormData(data: CreateFormDataBody): Promise<FormDataBody>;
  updateFormData(id: string, data: UpdateFormDataBody): Promise<FormDataBody>;
  deleteFormData(id: string): Promise<FormDataBody>;
}
