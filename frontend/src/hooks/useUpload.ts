import { useMutation, UseMutationResult } from "@tanstack/react-query";

interface UploadFileData {
  file: File;
  folder?: string;
}

interface UploadResult {
  url: string;
  key: string;
}

export function useUploadFile(): UseMutationResult<UploadResult, Error, UploadFileData> {
  return useMutation({
    mutationFn: async ({ file }: UploadFileData) => {
      const url = URL.createObjectURL(file);
      return {
        url,
        key: `local-${file.name}`,
      };
    },
  });
}
