export const docPath = (teamId: string | number, clientId: string | number, filename: string) => `${teamId}/${clientId}/${filename}`;
export const folderPrefix = (teamId: string | number, clientId: string | number) => `${teamId}/${clientId}`;
export const dataJsonPath = (teamId: string | number, clientId: string | number, key: string) => `${teamId}/${clientId}/data/${key}.json`;
