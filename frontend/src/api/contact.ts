import { useMutation } from "@tanstack/react-query";
import api from "./client";

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

interface ContactResponse {
  message: string;
}

export const useContactSubmission = () => {
  return useMutation({
    mutationFn: (data: ContactFormData) => 
      api.post<ContactResponse>("/contact/", data).then((r) => r.data),
    retry: 1,
  });
};