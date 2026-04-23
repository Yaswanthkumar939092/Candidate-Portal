/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ActionCenterDataService,
  ActionCenterMyRequestService,
  CandidateRaiseRequestService,
} from "@/lib/services/action-center"

// ─────────────────────────────────────────────
// useActionCenter
// ─────────────────────────────────────────────
export const useActionCenter = (email?: string) => {
  return useQuery({
    queryKey: ["action-center", email],
    queryFn: () => ActionCenterDataService.getActionCenterData(email!),
    enabled: !!email,
  })
}

// ─────────────────────────────────────────────
// useActionCenterMyRequest
// ─────────────────────────────────────────────
export const useActionCenterMyRequest = ({
  page = 1,
  limit = 10,
  userEmail,
}: {
  page?: number
  limit?: number
  userEmail?: string
}) => {
  return useQuery({
    queryKey: ["action-center-my-request", page, limit, userEmail],
    
    queryFn: () => {
      if (!userEmail) {
        return Promise.resolve([]) // ✅ safe fallback
      }

      // ✅ here TypeScript knows userEmail is string
      return ActionCenterMyRequestService.getActionCenterMyRequestService(
        page,
        limit,
        userEmail
      )
    },

    enabled: !!userEmail,
  })
}

// ─────────────────────────────────────────────
// useCandidateRaiseRequest ✅ FIXED
// ─────────────────────────────────────────────

export const useCandidateRaiseRequest = () => {
  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res =
        await CandidateRaiseRequestService.createCandidateRaiseRequest(payload)

      return res
    },
  })

  return {
    ...mutation,
    data: mutation.data, // ✅ explicitly expose
  }
}