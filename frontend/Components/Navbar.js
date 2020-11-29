import Link from 'next/link'
import { useSession, } from 'next-auth/client'

export default function Navbar() {
  const [session, loading] = useSession()
  // const { user } = session;
  console.log(session);
  return (
    <header>
      <nav>
        <ul>
          <li>
            <Link href="/">
              <a>Home</a>
            </Link>
          </li>
          {session ? (
            <>
              <li>
                <Link href="/profile">
                  <a>Profile</a>
                </Link>
              </li>
              <li>
                <a role="button" href="/api/auth/signout">
                  Logout
                </a>
              </li>
            </>
          ) : (
              <>
                <li>
                  <Link href="/api/auth/signin">
                    <a>Sign in</a>
                  </Link>
                </li>
              </>
            )}
        </ul>
      </nav>
      <style jsx>{`
        nav {
          max-width: 42rem;
          margin: 0 auto;
          padding: 0.2rem 1.25rem;
        }
        ul {
          display: flex;
          list-style: none;
          margin-left: 0;
          padding-left: 0;
        }
        li {
          margin-right: 1rem;
        }
        li:first-child {
          margin-left: auto;
        }
        a {
          color: #fff;
          text-decoration: none;
          cursor: pointer;
        }
        header {
          color: #fff;
          background-color: #0070f3;
        }
      `}</style>
    </header>
  )
}
