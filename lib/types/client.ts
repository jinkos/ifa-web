export type Client = {
  client_id: number;
  name: string;
  email?: string;
  address1?: string | null;
  address2?: string | null;
  postcode?: string | null;
  mobile?: string | null;
  landline?: string | null;
};
