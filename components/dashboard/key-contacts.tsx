import { Mail, Phone } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface Contact {
  name: string
  role: string
  email?: string
  phone?: string
  avatar?: string
}

interface KeyContactsProps {
  contacts: Contact[]
  className?: string
}

/**
 * Returns the initials (up to 2 characters) from a full name.
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Dashboard section listing key contacts such as the HR buddy, manager,
 * and IT support. Each contact shows an avatar (or initials fallback),
 * name, role, and action buttons for email and phone.
 *
 * Matches the PW Candidate Portal screenshot design with a section heading
 * and a bordered card per contact row.
 */
export function KeyContacts({ contacts, className }: KeyContactsProps) {
  if (contacts.length === 0) return null

  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="text-lg font-bold text-foreground">Your Key Contacts</h2>

      <div className="divide-y rounded-xl border bg-card shadow-sm">
        {contacts.map((contact) => (
          <div
            key={contact.name + contact.role}
            className="flex items-center gap-3 px-4 py-3 sm:px-5"
          >
            {/* Avatar */}
            <Avatar className="h-10 w-10 shrink-0">
              {contact.avatar && (
                <AvatarImage src={contact.avatar} alt={contact.name} />
              )}
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>

            {/* Name and role */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {contact.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {contact.role}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {contact.email && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary"
                >
                  <a
                    href={`mailto:${contact.email}`}
                    aria-label={`Email ${contact.name}`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </a>
                </Button>
              )}
              {contact.phone && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary"
                >
                  <a
                    href={`tel:${contact.phone}`}
                    aria-label={`Call ${contact.name}`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call
                  </a>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
