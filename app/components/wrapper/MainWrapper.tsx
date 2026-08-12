
import Navbar from '../Navbar';
import SideNavbar from '../SideNavbar';
import ActivitySidebar from "../ActivitySidebar";
import { UserProvider } from '@/app/context/UserContext';
import { getCurrentUser } from '@/utils/getCurrentUser';
import ContentWrapper from './ContentWrapper';

export default async function MainWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const user = await getCurrentUser();

  const isReelsPage = false;
  
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