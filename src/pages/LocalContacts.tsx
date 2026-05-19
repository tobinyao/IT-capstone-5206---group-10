import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

// Extra organisation that a person is also affiliated with (e.g. WKSN
// for Sean). Rendered as a small logo + name block at the bottom of a
// person card.
type ExtraAffiliation = {
  label: string
  orgName: string
  logoUrl: string
  logoAlt: string
}

// A contact representing an individual person (e.g. a UWA researcher).
// The `kind` field is the discriminator for the ContactEntry union.
type PersonContact = {
  kind: 'person'
  name: string
  title: string
  projectRole: string
  academicRole: string
  email: string
  extraAffiliation: ExtraAffiliation | null
}

// A single off-site link surfaced on an organisation card (e.g. a link
// to a department's "Today's burns" page). `description` is an optional
// one-liner explaining why the link is relevant.
type RelevantLink = {
  label: string
  url: string
  description?: string
}

// A contact representing an institution (e.g. a government department)
// rather than a named person. Organisation cards typically expose a
// general enquiries phone number, a website, an online contact form,
// and any topic-relevant links. `id` is used as the React key in the
// renderer since organisations do not carry a personal email.
// `address` is optional because not every organisation card needs to
// surface a physical office — when present, it renders as a "View on
// map" line in the card with `mapUrl` pointing at Google Maps.
type OrganisationContact = {
  kind: 'organisation'
  id: string
  orgName: string
  affiliation: string
  badgeLabel: string
  address?: {
    line: string
    mapUrl: string
  }
  phone: {
    number: string
    note?: string
  }
  website: {
    url: string
    display: string
  }
  contactForm: {
    url: string
    display?: string
  }
  relevantLinks: ReadonlyArray<RelevantLink>
}

// Discriminated union of every kind of entry that can appear on the
// Local Contacts page. The renderer switches on `entry.kind` to pick
// the matching card component.
type ContactEntry = PersonContact | OrganisationContact

// A visually-grouped set of contacts rendered together under a single
// heading (e.g. "Project Team", "Government & Regulatory"). Sections
// keep related contacts together and let new categories be added
// without restructuring the page.
type ContactSection = {
  id: string
  heading: string
  entries: ReadonlyArray<ContactEntry>
}

// Page content, grouped into sections. Order matters: the Project Team
// is the primary point of contact, with Government & Regulatory shown
// below as a secondary referral. Project Team data sourced from issue
// #82 (Local Contacts); DBCA data sourced from the official website
// (https://www.dbca.wa.gov.au).
const contactSections: ReadonlyArray<ContactSection> = [
  {
    id: 'project-team',
    heading: 'Project Team',
    entries: [
      {
        kind: 'person',
        name: 'Sean Winter',
        title: 'Dr, BA PhD W.Aust.',
        projectRole: 'Client / Project Owner',
        academicRole: 'Adjunct Lecturer, School of Social Sciences, Archaeology',
        email: 'sean.winter@uwa.edu.au',
        extraAffiliation: {
          label: 'Also affiliated with',
          orgName: 'Wagyl Kaip Southern Noongar (WKSN) Aboriginal Corporation',
          logoUrl:
            'https://images.squarespace-cdn.com/content/v1/61f8e2c584741255f5ca8798/290d1715-85eb-4c72-a7e6-9c59ca2501ca/WKSNLogo.png',
          logoAlt: 'Wagyl Kaip Southern Noongar logo',
        },
      },
      {
        kind: 'person',
        name: 'Sven Ouzman',
        title: 'PhD Berkeley, SFHEA',
        projectRole: 'Client / Project Owner',
        academicRole:
          'Associate Professor, School of Social Sciences; School of Social Sciences, Archaeology; Centre for Rock Art Research and Management',
        email: 'sven.ouzman@uwa.edu.au',
        extraAffiliation: null,
      },
    ],
  },
  {
    id: 'government-regulatory',
    heading: 'Government & Regulatory',
    entries: [
      // DBCA Albany office — Parks and Wildlife Service, South Coast
      // Region. Added per client feedback ("Contact should have DBCA
      // Albany"). This is the only DBCA contact surfaced because the
      // tool is Franklin-District-specific and the South Coast Region
      // is the team that actually runs prescribed burns and on-ground
      // conservation across Albany / Mt Barker / Denmark — users with
      // a heritage-fire question reach the right people fastest by
      // calling Albany directly. The Perth headquarters entry was
      // removed in the same change to avoid two near-identical DBCA
      // cards (same website, contact form, and "Today's burns" link
      // as Albany, differing only by a general-enquiries phone number
      // that just routes back out to regional offices). Users who do
      // need to reach Perth HQ for policy / complaints can still find
      // it from dbca.wa.gov.au below.
      //
      // Contact details verified via the public Google Maps listing
      // for "DBCA's Parks and Wildlife Service – South Coast Region",
      // 120 Albany Hwy, Centennial Park WA 6330.
      {
        kind: 'organisation',
        id: 'dbca-albany',
        orgName:
          "DBCA's Parks and Wildlife Service – South Coast Region",
        affiliation: 'Government of Western Australia · Albany',
        badgeLabel: 'Parks & Wildlife · Albany',
        address: {
          line: '120 Albany Hwy, Centennial Park WA 6330',
          // Google Maps "search by address" deep link — works on web,
          // iOS, and Android, and falls back to the browser if no map
          // app is installed. Address is URL-encoded inline so the
          // string stays readable at the call site.
          mapUrl:
            'https://www.google.com/maps/search/?api=1&query=120+Albany+Hwy%2C+Centennial+Park+WA+6330',
        },
        phone: {
          number: '(08) 9842 4500',
          note: 'Albany office · Mon–Fri',
        },
        website: {
          url: 'https://www.dbca.wa.gov.au',
          display: 'dbca.wa.gov.au',
        },
        contactForm: {
          url: 'https://www.dbca.wa.gov.au/contact-us',
          display: 'dbca.wa.gov.au/contact-us',
        },
        relevantLinks: [
          {
            label: "Today's burns",
            url: 'https://www.dbca.wa.gov.au/management/fire/prescribed-burning/todays-burns',
            description: 'Current prescribed burn program updates',
          },
        ],
      },
    ],
  },
]

// Small helper for the eyebrow label of each card section. Renders a
// tiny accent-coloured icon (passed in as children, e.g. a <path> set)
// next to the uppercase label text. Extracted so both card variants
// (PersonCard / OrganisationCard) share the same icon-on-the-left
// visual treatment without copy/paste, and so swapping the icon set
// is a one-line change at the call site.
const FieldLabel = ({
  icon,
  accentClass,
  children,
}: {
  icon: ReactNode
  accentClass: string
  children: ReactNode
}) => (
  <div className="flex items-center gap-1.5 mb-1">
    <svg
      className={`w-3 h-3 ${accentClass}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icon}
    </svg>
    <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
      {children}
    </span>
  </div>
)

// Lucide-style stroked icon paths used by FieldLabel. Inlined as JSX
// fragments rather than separate components so the SVG stroke
// attributes stay defined in one place (FieldLabel above).
const ICONS = {
  mapPin: (
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
  mail: (
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
} as const

// Card UI for a single person contact (e.g. a UWA project owner).
// Extracted from the page renderer so the section loop can stay focused
// on layout, and so a second card variant (organisation) can sit
// alongside this one in a later change without crowding the JSX.
const PersonCard = ({ person }: { person: PersonContact }) => (
  // Card lifts subtly on hover to mirror OrganisationCard. Tailwind
  // auto-enables `transform` when a translate utility is used, so we do
  // not need an explicit `transform` class.
  <article className="relative bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
    {/* Header colour bar */}
    <div className="h-3 w-full bg-[#8B2020]" />

    {/* Project Role badge — pinned top-right of card body */}
    <span className="absolute top-6 right-5 text-[10px] font-black uppercase tracking-widest bg-[#8B2020] text-white px-2.5 py-1 rounded-full">
      Project Owner
    </span>

    <div className="p-7 flex-1 flex flex-col">
      {/* Name — h3 because the section heading above is the h2. */}
      <h3 className="text-2xl font-black text-gray-900 pr-32">
        {person.name}
      </h3>
      {/* Title / qualifications */}
      <p className="text-sm text-gray-500 mt-1 mb-5">{person.title}</p>

      {/* Project Role */}
      <div className="mb-4">
        <FieldLabel icon={ICONS.briefcase} accentClass="text-[#8B2020]">
          Project Role
        </FieldLabel>
        <p className="text-sm font-bold text-[#8B2020]">
          {person.projectRole}
        </p>
      </div>

      {/* Academic Role */}
      <div className="mb-4">
        <FieldLabel icon={ICONS.book} accentClass="text-[#8B2020]">
          Academic Role
        </FieldLabel>
        <p className="text-sm text-gray-800 leading-relaxed">
          {person.academicRole}
        </p>
      </div>

      {/* Email */}
      <div className="mb-4">
        <FieldLabel icon={ICONS.mail} accentClass="text-[#8B2020]">
          Email
        </FieldLabel>
        <a
          href={`mailto:${person.email}`}
          className="text-sm font-medium text-[#1565C0] hover:text-[#0D47A1] hover:underline break-all"
        >
          {person.email}
        </a>
      </div>

      {/* Extra affiliation (e.g. WKSN for Sean). The label here comes
          from the data ("Also affiliated with"), so we render it via
          FieldLabel with a generic link icon to keep visual parity
          with the other sections. */}
      {person.extraAffiliation && (
        <div className="mt-auto pt-5 border-t border-gray-200">
          <FieldLabel icon={ICONS.link} accentClass="text-[#8B2020]">
            {person.extraAffiliation.label}
          </FieldLabel>
          <div className="flex items-center gap-3 rounded-lg bg-[#F0EDE8] px-3 py-2.5 mt-1">
            <img
              src={person.extraAffiliation.logoUrl}
              alt={person.extraAffiliation.logoAlt}
              className="w-10 h-10 rounded object-contain bg-white p-1 flex-shrink-0"
            />
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {person.extraAffiliation.orgName}
            </p>
          </div>
        </div>
      )}
    </div>
  </article>
)

// Card UI for an organisation contact (e.g. a government department).
// Mirrors the visual language of PersonCard so the two card types feel
// like siblings, but uses a green accent (instead of the project-owner
// red) and org-specific fields so users can tell at a glance that the
// contact is institutional rather than an individual.
//
// The card lifts on hover (translate + shadow) to give a tactile sense
// that the links inside are interactive. Tailwind handles the
// `transform` utility implicitly when a `translate-*` class is used,
// so no explicit `transform` class is needed.
const OrganisationCard = ({ org }: { org: OrganisationContact }) => {
  // tel: URIs should contain only digits and an optional leading `+`,
  // so strip the human-readable spaces and brackets from the display
  // number before using it as an href.
  const telHref = `tel:${org.phone.number.replace(/[^\d+]/g, '')}`

  return (
    <article className="relative bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Header colour bar — green to differentiate from project-owner cards. */}
      <div className="h-3 w-full bg-[#2E7D32]" />

      {/* Category badge — pinned top-right of card body */}
      <span className="absolute top-6 right-5 text-[10px] font-black uppercase tracking-widest bg-[#2E7D32] text-white px-2.5 py-1 rounded-full">
        {org.badgeLabel}
      </span>

      <div className="p-7 flex-1 flex flex-col">
        {/* Organisation name — h3 because the section heading above is the h2. */}
        <h3 className="text-2xl font-black text-gray-900 pr-32">
          {org.orgName}
        </h3>
        {/* Affiliation / jurisdiction (e.g. "Government of Western Australia") */}
        <p className="text-sm text-gray-500 mt-1 mb-5">{org.affiliation}</p>

        {/* Address — only rendered when an organisation supplies a
            physical office. Sits before Phone so the user's mental
            model goes "where" then "how to reach". */}
        {org.address && (
          <div className="mb-4">
            <FieldLabel icon={ICONS.mapPin} accentClass="text-[#2E7D32]">
              Address
            </FieldLabel>
            <a
              href={org.address.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[#1565C0] hover:text-[#0D47A1] hover:underline"
            >
              {org.address.line} ↗
            </a>
          </div>
        )}

        {/* Phone */}
        <div className="mb-4">
          <FieldLabel icon={ICONS.phone} accentClass="text-[#2E7D32]">
            Phone
          </FieldLabel>
          <a
            href={telHref}
            className="text-sm font-medium text-[#1565C0] hover:text-[#0D47A1] hover:underline"
          >
            {org.phone.number}
          </a>
          {org.phone.note && (
            <p className="text-xs text-gray-500 mt-0.5">{org.phone.note}</p>
          )}
        </div>

        {/* Website */}
        <div className="mb-4">
          <FieldLabel icon={ICONS.globe} accentClass="text-[#2E7D32]">
            Website
          </FieldLabel>
          <a
            href={org.website.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#1565C0] hover:text-[#0D47A1] hover:underline break-all"
          >
            {org.website.display} ↗
          </a>
        </div>

        {/* Contact form — most government departments publish a web
            form rather than a public enquiries inbox. */}
        <div className="mb-4">
          <FieldLabel icon={ICONS.mail} accentClass="text-[#2E7D32]">
            Contact form
          </FieldLabel>
          <a
            href={org.contactForm.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#1565C0] hover:text-[#0D47A1] hover:underline break-all"
          >
            {org.contactForm.display ?? 'Submit an enquiry'} ↗
          </a>
        </div>

        {/* Relevant links — pinned to the bottom of the card so the
            block lines up visually with PersonCard's extra-affiliation
            block. Hidden entirely when there are no links to show.
            Each pill lifts subtly on hover to mirror the card-level
            hover affordance. */}
        {org.relevantLinks.length > 0 && (
          <div className="mt-auto pt-5 border-t border-gray-200">
            <FieldLabel icon={ICONS.link} accentClass="text-[#2E7D32]">
              Relevant links
            </FieldLabel>
            <ul className="space-y-2 mt-1">
              {org.relevantLinks.map((link) => (
                <li
                  key={link.url}
                  className="rounded-lg bg-[#F0EDE8] px-3 py-2.5 hover:bg-[#E8E3DA] transition-colors"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[#1565C0] hover:text-[#0D47A1] hover:underline"
                  >
                    {link.label} ↗
                  </a>
                  {link.description && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      {link.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  )
}

const LocalContacts = () => {
  return (
    <div
      className="flex flex-col items-center px-12 py-10 h-full overflow-y-auto"
      style={{ background: '#F0EDE8' }}
    >
      {/* Title */}
      <h1 className="text-3xl font-black uppercase tracking-wide mb-2">
        LOCAL CONTACTS
      </h1>

      {/* Subtitle */}
      <p className="text-base font-medium text-gray-700 italic mb-10 text-center">
        Project leads and relevant authorities for fire risk in Franklin District
      </p>

      {/* Contact sections — each section renders a heading followed by
          its own grid of cards. Iterating over `contactSections` keeps
          the page easily extensible: new groups (e.g. government,
          emergency services) only need a new entry in the data array. */}
      {contactSections.map((section) => (
        <section key={section.id} className="w-full max-w-5xl mb-10">
          <h2 className="text-sm font-black uppercase tracking-[0.25em] text-gray-700 mb-4">
            {section.heading}
          </h2>
          {/* Single-entry sections are centred and constrained so the
              lone card does not float awkwardly in one half of an
              otherwise empty 2-column grid. */}
          <div
            className={
              section.entries.length === 1
                ? 'grid grid-cols-1 gap-6 md:max-w-lg md:mx-auto'
                : 'grid grid-cols-1 md:grid-cols-2 gap-6'
            }
          >
            {section.entries.map((entry) =>
              entry.kind === 'person' ? (
                <PersonCard key={entry.email} person={entry} />
              ) : (
                <OrganisationCard key={entry.id} org={entry} />
              ),
            )}
          </div>
        </section>
      ))}

      {/* Back link */}
      <Link
        to="/regulation"
        className="text-sm font-bold text-gray-700 hover:text-[#8B2020] transition-colors"
      >
        ← Back to Fire Risk Regulation
      </Link>
    </div>
  )
}

export default LocalContacts
