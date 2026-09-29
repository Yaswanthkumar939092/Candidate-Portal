import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accessKey, directApplicantFormService, type FormAccess } from "../services/direct-applicant-form";

const key = (access: FormAccess) => ["direct-applicant-form", accessKey(access)];

export const useDirectApplicantForm = (access: FormAccess) =>
  useQuery({
    queryKey: key(access),
    queryFn: () => directApplicantFormService.getForm(access),
    enabled: !!accessKey(access),
    retry: false,
    refetchOnWindowFocus: false,
  });

export const useSubmitDirectApplicantForm = (access: FormAccess) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => directApplicantFormService.submit(access, data),
    // Returned, so the mutation stays pending (button disabled) until the page
    // has the new state — no window for a second click.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: key(access) }),
        queryClient.invalidateQueries({ queryKey: ["action-center"] }),
      ]),
  });
};
