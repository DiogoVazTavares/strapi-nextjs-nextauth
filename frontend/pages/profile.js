import { useEffect, useState } from 'react';
import Router from 'next/router';
import { useSession, } from 'next-auth/client';
import Layout from '../Components/Layout';

const Profile = () => {
  const [session, loading] = useSession()
  const [user, setUser] = useState();

  useEffect(() => {
    // redirect user to login if not authenticated
    if (!loading && !session) Router.replace('/login')

  }, [user, loading])

  useEffect(async () => {
    if (!session) {
      return;
    }

    const { jwt } = session;
    const reqUser = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        "Authorization": `Bearer ${jwt}`
      }
    });

    const data = await reqUser.json();
    if (!reqUser.ok) {
      console.log(reqUser.state);
    }

    setUser(data);
  }, [])



  return (
    <Layout>
      <h1>Profile</h1>
      {user &&
        <pre>{JSON.stringify(user, null, 2)}</pre>
      }
    </Layout>
  )
};

export default Profile;
