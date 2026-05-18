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
type OrganisationContact = {
  kind: 'organisation'
  id: string
  orgName: string
  affiliation: string
  badgeLabel: string
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
      {
        kind: 'organisation',
        id: 'dbca',
        orgName:
          'Department of Biodiversity, Conservation and Attractions',
        affiliation: 'Government of Western Australia',
        badgeLabel: 'Government Agency',
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
    ],
  },
]

// Card UI for a single person contact (e.g. a UWA project owner).
// Extracted from the page renderer so the section loop can stay focused
// on layout, and so a second card variant (organisation) can sit
// alongside this one in a later change without crowding the JSX.
const PersonCard = ({ person }: { person: PersonContact }) => (
  <article className="relative bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
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
        <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
          Project Role
        </div>
        <p className="text-sm font-bold text-[#8B2020]">
          {person.projectRole}
        </p>
      </div>

      {/* Academic Role */}
      <div className="mb-4">
        <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
          Academic Role
        </div>
        <p className="text-sm text-gray-800 leading-relaxed">
          {person.academicRole}
        </p>
      </div>

      {/* Email */}
      <div className="mb-4">
        <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
          Email
        </div>
        <a
          href={`mailto:${person.email}`}
          className="text-sm font-medium text-[#1565C0] hover:text-[#0D47A1] hover:underline break-all"
        >
          {person.email}
        </a>
      </div>

      {/* Extra affiliation (e.g. WKSN for Sean) */}
      {person.extraAffiliation && (
        <div className="mt-auto pt-5 border-t border-gray-200">
          <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">
            {person.extraAffiliation.label}
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-[#F0EDE8] px-3 py-2.5">
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
const OrganisationCard = ({ org }: { org: OrganisationContact }) => {
  // tel: URIs should contain only digits and an optional leading `+`,
  // so strip the human-readable spaces and brackets from the display
  // number before using it as an href.
  const telHref = `tel:${org.phone.number.replace(/[^\d+]/g, '')}`

  return (
    <article className="relative bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
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

        {/* Phone */}
        <div className="mb-4">
          <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
            Phone
          </div>
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
          <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
            Website
          </div>
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
          <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
            Contact form
          </div>
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
            block. Hidden entirely when there are no links to show. */}
        {org.relevantLinks.length > 0 && (
          <div className="mt-auto pt-5 border-t border-gray-200">
            <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">
              Relevant links
            </div>
            <ul className="space-y-2">
              {org.relevantLinks.map((link) => (
                <li
                  key={link.url}
                  className="rounded-lg bg-[#F0EDE8] px-3 py-2.5"
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
