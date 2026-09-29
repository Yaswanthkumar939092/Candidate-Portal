import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ctcProposalService, proposalAccessKey, type ProposalAccess } from "../services/ctc-proposal";
import type { CtcResponsePayload } from "../types/ctc-proposal";

const key = (access: ProposalAccess) => ["ctc-proposal", proposalAccessKey(access)];

export const useCtcProposal = (access: ProposalAccess) =>
  useQuery({
    queryKey: key(access),
    queryFn: () => ctcProposalService.getProposal(access),
    enabled: !!proposalAccessKey(access),
    retry: false,
    refetchOnWindowFocus: false,
  });

export const useRespondToCtcProposal = (access: ProposalAccess) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CtcResponsePayload) => ctcProposalService.respond(access, payload),
    // Returned, so the mutation stays pending (button disabled) until the page
    // has the new state — no window for a second click.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: key(access) }),
        queryClient.invalidateQueries({ queryKey: ["action-center"] }),
      ]),
  });
};
