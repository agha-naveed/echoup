
import Navbar from '../Navbar';
import SideNavbar from '../SideNavbar';
import ActivitySidebar from "../ActivitySidebar";
import { UserProvider } from '@/app/context/UserContext';
import { getCurrentUser } from '@/utils/getCurrentUser';
import ContentWrapper from './ContentWrapper';
import { redirect } from 'next/navigation';

export default async function MainWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login"); 
  }

  return (
    <>
      <div>
        <UserProvider initialUser={user}>
          <Navbar />
          <div className='flex justify-between'>
            <SideNavbar />
              <ContentWrapper>
                {children}
              </ContentWrapper>
            <ActivitySidebar />
          </div>
        </UserProvider>
      </div>
    </>
  )
}