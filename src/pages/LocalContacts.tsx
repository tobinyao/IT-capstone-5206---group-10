import type { ReactNode } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, Rectangle } from 'react-leaflet'
import { Link } from 'react-router-dom'

// Outer bounding box of the project's Franklin District (FRK) study
// area, taken from `analysis_bounds_epsg_7844` in
// public/data/processed/metadata.json and rounded to four decimal
// places so the rectangle drawn on the page lines up with the FRK
// outline rendered on the Risk Map. Used by every ServiceAreaMap as
// the dashed context frame, with each office's coverageBounds drawn
// as a filled subset inside it.
//
// Naming caveat: the project uses "Franklin District" (with an 'i')
// for FRK; DBCA happens to have an internal admin unit called
// "Frankland District" (with an 'a') headquartered in Walpole that
// manages the western part of FRK. The two are unrelated — same
// English root, different spellings, different scope.
const FRK_STUDY_BOUNDS: [[number, number], [number, number]] = [
  [-35.2039, 116.8987],
  [-34.1958, 118.012],
]

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
//
// `serviceArea` is independent of `address` on purpose: an office can
// sit in one city (Albany) while operationally serving a different
// region (Franklin District). When supplied, the page renderer drops
// in a companion ServiceAreaMap card beside the OrganisationCard,
// showing where the team's work happens rather than the street where
// the front door is — the address itself is already a Google Maps
// deep link on the main card, so the inline map adds the bigger
// picture.
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
  // The subset of FRK_STUDY_BOUNDS this office actually administers.
  // Each ServiceAreaMap always draws the full FRK rectangle as a
  // dashed outline for context, then fills `coverageBounds` with
  // `coverageColor` to make it clear which slice of the study area
  // the office is responsible for. Optional because non-spatial
  // organisations would not have a meaningful coverage box.
  serviceArea?: {
    label: string
    coverageBounds: [[number, number], [number, number]]
    coverageColor: string
  }
  phone: {
    number: string
    note?: string
  }
  // Optional direct-to-team email address. Some DBCA district offices
  // publish a team mailbox (e.g. frankland.district@dbca.wa.gov.au)
  // while others only publish a switchboard number, so this is left
  // optional rather than required.
  email?: string
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
      // Region, Albany District. Added per client feedback ("Contact
      // should have DBCA Albany"). Covers the EASTERN portion of FRK:
      // Stirling Range National Park, Mt Barker / Plantagenet,
      // Albany, Denmark, Wilson Inlet, Porongurup. DBCA's published
      // boundary places South Coast Region from Irwin Inlet (near
      // Walpole) east to the South Australian border, so the FRK
      // east-of-117.30 strip falls cleanly inside it. The Perth
      // headquarters entry was removed in an earlier commit to avoid
      // two near-identical DBCA cards — users who do need Perth HQ
      // for policy / complaints can still find it from dbca.wa.gov.au.
      //
      // Western FRK (Mt Roe NP, Mt Lindesay NP) is handled by the
      // separate Frankland District (Walpole) entry below, not by
      // Albany.
      //
      // Contact details verified via the public Google Maps listing
      // for "DBCA's Parks and Wildlife Service – South Coast Region",
      // 120 Albany Hwy, Centennial Park WA 6330.
      {
        kind: 'organisation',
        id: 'dbca',
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
        // Coverage subset of FRK: everything east of approx. lng
        // 117.30 — Stirling Range, Porongurup, Mt Barker, Albany,
        // Denmark. The 117.30 split is a longitude approximation of
        // the real DBCA administrative boundary, which runs through
        // the area between Mt Lindesay (Frankland District, lng ~117.20)
        // and Denmark (Albany District, lng ~117.35). For an exact
        // polygon the project could pull DBCA-022 / DBCA-023 from
        // data.wa.gov.au, but the approximation is well within the
        // resolution of a mini map at this size.
        serviceArea: {
          label: 'Albany District',
          coverageBounds: [
            [-35.2039, 117.3],
            [-34.1958, 118.012],
          ],
          coverageColor: '#2E7D32',
        },
        phone: {
          number: '(08) 9219 9000',
          note: 'General enquiries · Mon–Fri',
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
      // DBCA Frankland District office (Walpole) — Parks and Wildlife
      // Service, Warren Region. Added in tandem with the Albany card
      // because FRK actually straddles two DBCA regions: Albany handles
      // the eastern half, Frankland handles the western half. The
      // "Walpole Wilderness" group of seven national parks (Walpole-
      // Nornalup, Mt Frankland, Shannon, Mt Frankland South / North,
      // Mt Roe, Mt Lindesay) is administered here, and Mt Roe NP plus
      // Mt Lindesay NP both fall inside FRK's western edge — so a user
      // calling about an incident in those parks needs Walpole, not
      // Albany.
      //
      // Naming caveat: this is DBCA's "Frankland" District (with an
      // 'a'), unrelated to the project's "Franklin" District (FRK,
      // with an 'i'). Same English root, different spellings; do not
      // collapse them in copy.
      //
      // Contact details verified against the DBCA office locations
      // page and the public Frankland District directory listings.
      {
        kind: 'organisation',
        id: 'dbca-frankland',
        orgName:
          "DBCA's Parks and Wildlife Service – Frankland District",
        affiliation: 'Government of Western Australia · Walpole',
        badgeLabel: 'Parks & Wildlife · Walpole',
        address: {
          line: 'South Coast Hwy, Walpole WA 6398',
          mapUrl:
            'https://www.google.com/maps/search/?api=1&query=South+Coast+Hwy%2C+Walpole+WA+6398',
        },
        // Coverage subset of FRK: everything west of approx. lng
        // 117.30 — Mt Roe NP and Mt Lindesay NP (both part of the
        // Walpole Wilderness group). Same longitude approximation as
        // the Albany card's eastern half — see that card's serviceArea
        // comment for the exact admin-boundary caveat. Coverage colour
        // is a warm brown so the two regions are visually distinct on
        // the map even though both cards share the green DBCA chrome.
        serviceArea: {
          label: 'Frankland District',
          coverageBounds: [
            [-35.2039, 116.8987],
            [-34.1958, 117.3],
          ],
          coverageColor: '#6D4C41',
        },
        phone: {
          number: '(08) 9840 0400',
          note: 'Walpole office · Mon–Fri',
        },
        email: 'frankland.district@dbca.wa.gov.au',
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
            label: 'Walpole Wilderness management plan',
            url: 'https://www.dbca.wa.gov.au/media/1389/download',
            description:
              'Statutory plan covering the seven Walpole Wilderness national parks',
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
  clipboard: (
    <>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
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

        {/* Email — only rendered when the org publishes a direct
            mailbox (some district offices do, some only publish a
            switchboard number). Uses the same envelope icon as the
            PersonCard's Email field so the visual language matches. */}
        {org.email && (
          <div className="mb-4">
            <FieldLabel icon={ICONS.mail} accentClass="text-[#2E7D32]">
              Email
            </FieldLabel>
            <a
              href={`mailto:${org.email}`}
              className="text-sm font-medium text-[#1565C0] hover:text-[#0D47A1] hover:underline break-all"
            >
              {org.email}
            </a>
          </div>
        )}

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
            form rather than a public enquiries inbox. Uses a clipboard
            icon (not envelope) so it stays visually distinct from the
            direct-email row above when both are present. */}
        <div className="mb-4">
          <FieldLabel icon={ICONS.clipboard} accentClass="text-[#2E7D32]">
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

// Companion card to OrganisationCard: a display-only Leaflet mini map
// showing the region the organisation services, not its street address.
// The street address is already a Google Maps deep link on the main
// OrganisationCard, so this map covers the bigger picture — for
// example, the Albany office sits in Albany city but services the
// whole Franklin District, and that is what the pin/zoom reflects.
//
// All Leaflet interactions are disabled (dragging, wheel zoom, double
// click zoom, touch zoom, keyboard, zoom control) so the map is purely
// informational and never accidentally panned when scrolling the page.
// The same display-only pattern is used on the Login page's "FRK
// Location" mini map; the styling here matches OrganisationCard
// (rounded corners, same green header bar, same hover lift, same
// top-right pill badge) so the pair reads as one visual unit.
const ServiceAreaMap = ({
  coverageBounds,
  coverageColor,
  label,
}: {
  coverageBounds: [[number, number], [number, number]]
  coverageColor: string
  label: string
}) => {
  // Pin sits at the centre of the office's coverage area (not the
  // centre of the whole FRK study area), so the label clearly belongs
  // to that office's slice. Computed here rather than stored on the
  // data because it is purely derived.
  const [[south, west], [north, east]] = coverageBounds
  const center: [number, number] = [
    (south + north) / 2,
    (west + east) / 2,
  ]

  return (
    <article className="relative bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Header colour bar — green to match the OrganisationCard it
          sits beside, so the two cards visually belong together. */}
      <div className="h-3 w-full bg-[#2E7D32]" />

      {/* "Coverage" pill badge — mirrors the OrganisationCard's
          top-right badge so the two cards share an identical
          structural rhythm. The label is intentionally "Coverage" and
          not "Service Area" because the rectangle drawn below is the
          slice of FRK this office covers, not DBCA's full operational
          jurisdiction (which extends well beyond FRK).
          z-index lifts the badge above Leaflet's own panes (default
          starts around 400). */}
      <span className="absolute top-6 right-5 z-[1000] text-[10px] font-black uppercase tracking-widest bg-[#2E7D32] text-white px-2.5 py-1 rounded-full">
        FRK Coverage
      </span>

      {/* Map fills the remaining vertical space (flex-1) so the card
          stretches to match the height of its sibling OrganisationCard
          inside the CSS Grid (default align-items: stretch). The map
          is always fit to the FULL FRK study-area bounds (not just the
          office's coverageBounds) so the user can see this office's
          slice in the context of the whole project area. */}
      <div className="flex-1 p-3 flex">
        <MapContainer
          bounds={FRK_STUDY_BOUNDS}
          boundsOptions={{ padding: [12, 12] }}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          touchZoom={false}
          keyboard={false}
          zoomControl={false}
          attributionControl={false}
          style={{
            height: '100%',
            width: '100%',
            minHeight: 420,
            borderRadius: 12,
            background: '#eef0e5',
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {/* Outer dashed rectangle outlining the full FRK study area.
              Stroke style mirrors the FRK rectangle drawn on the Risk
              Map page so the same area reads identically in both
              places. Drawn underneath the coverage fill so the
              coverage rectangle's solid edge sits on top. */}
          <Rectangle
            bounds={FRK_STUDY_BOUNDS}
            pathOptions={{
              color: '#202124',
              weight: 2,
              fillOpacity: 0,
              dashArray: '6 4',
            }}
          />
          {/* This office's coverage slice of FRK, filled with the
              office-specific colour at low opacity so the underlying
              basemap detail still shows through. Stroke uses the same
              colour at full opacity for a clear edge. */}
          <Rectangle
            bounds={coverageBounds}
            pathOptions={{
              color: coverageColor,
              weight: 2,
              fillColor: coverageColor,
              fillOpacity: 0.28,
            }}
          />
          {/* Centre marker carries the permanent Tooltip label, sat at
              the centre of THIS office's coverage rectangle. CircleMarker
              avoids the Vite/Leaflet default-icon asset issue and
              matches the red accent used elsewhere in the project for
              focal-point pins. */}
          <CircleMarker
            center={center}
            radius={7}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: '#B03A2E',
              fillOpacity: 1,
            }}
          >
            <Tooltip permanent direction="bottom" offset={[0, 8]}>
              {label}
            </Tooltip>
          </CircleMarker>
        </MapContainer>
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
          emergency services) only need a new entry in the data array.
          Each entry can also expand into more than one card at render
          time — an organisation with a `serviceArea` yields the
          OrganisationCard AND a companion ServiceAreaMap so the grid
          stays balanced even when a section logically has only one
          entry. */}
      {contactSections.map((section) => {
        const renderedCards = section.entries.flatMap((entry) => {
          if (entry.kind === 'person') {
            return [<PersonCard key={entry.email} person={entry} />]
          }
          const cards = [
            <OrganisationCard key={entry.id} org={entry} />,
          ]
          if (entry.serviceArea) {
            cards.push(
              <ServiceAreaMap
                key={`${entry.id}-map`}
                coverageBounds={entry.serviceArea.coverageBounds}
                coverageColor={entry.serviceArea.coverageColor}
                label={entry.serviceArea.label}
              />,
            )
          }
          return cards
        })

        return (
          <section key={section.id} className="w-full max-w-5xl mb-10">
            <h2 className="text-sm font-black uppercase tracking-[0.25em] text-gray-700 mb-4">
              {section.heading}
            </h2>
            {/* Single-card sections are centred and constrained so the
                lone card does not float awkwardly in one half of an
                otherwise empty 2-column grid. The decision is based on
                the post-flatMap count, not section.entries.length, so
                a single org that expanded to a card+map pair is still
                rendered as a balanced two-column row. */}
            <div
              className={
                renderedCards.length === 1
                  ? 'grid grid-cols-1 gap-6 md:max-w-lg md:mx-auto'
                  : 'grid grid-cols-1 md:grid-cols-2 gap-6'
              }
            >
              {renderedCards}
            </div>
          </section>
        )
      })}

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
