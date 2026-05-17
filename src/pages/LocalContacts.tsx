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
// The `kind` field is the discriminator for the ContactEntry union;
// additional kinds (e.g. an organisation contact such as DBCA) will be
// introduced in a later change.
type PersonContact = {
  kind: 'person'
  name: string
  title: string
  projectRole: string
  academicRole: string
  email: string
  extraAffiliation: ExtraAffiliation | null
}

// Discriminated union of every kind of entry that can appear on the
// Local Contacts page. Today only `PersonContact` is a member; the
// union is introduced now so downstream rendering can switch on
// `entry.kind` once more kinds are added.
type ContactEntry = PersonContact

// UWA-based researchers leading the project. Data sourced from
// issue #82 (Local Contacts).
const contacts: ReadonlyArray<ContactEntry> = [
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
]

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
        UWA-based researchers leading this project
      </p>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mb-10">
        {contacts.map((person) => (
          <article
            key={person.email}
            className="relative bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col"
          >
            {/* Header colour bar */}
            <div className="h-3 w-full bg-[#8B2020]" />

            {/* Project Role badge — pinned top-right of card body */}
            <span
              className="absolute top-6 right-5 text-[10px] font-black uppercase tracking-widest bg-[#8B2020] text-white px-2.5 py-1 rounded-full"
            >
              Project Owner
            </span>

            <div className="p-7 flex-1 flex flex-col">
              {/* Name */}
              <h2 className="text-2xl font-black text-gray-900 pr-32">
                {person.name}
              </h2>
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
        ))}
      </div>

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
