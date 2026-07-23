import { NavLink, useLocation } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import { appTokens } from '../constants/tokens'
import { getToneClass } from '../components/toneClasses'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'
import ToastContainer from '../components/ToastContainer'
import { NotOnDesktop } from '../components/visibility/DeviceVisibility';

type PageLayoutProps = {
  children: ReactNode
  className?: string
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return (
    <main className={appTokens.pageShell}>
      <div
        className={`flex flex-col ${className} ${
          isFullscreen ? 'w-full h-full' : 'mx-auto max-w-6xl'
        }`.trim()}
      >
        {!isHomePage && (
          <div className="mb-4">
             {!isFullscreen && (
                <NavLink
                  to="/"
                  className={getToneClass(
                    'default',
                    `inline-flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                      isFullscreen ? 'hidden' : ''
                    }`,
                  )}
                >
                  <DecorativeIcon icon="home" className="h-4 w-4" />
                  <span>Go Home</span>
                </NavLink>
              )}
                <NavLink
                  to="#"
                  onClick={toggleFullscreen}
                  className={getToneClass(
                    'default',
                    `inline-flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                      isFullscreen ? 'fixed top-4 right-4 z-50' : ''
                    }`,
                  )}
                >
                  {isFullscreen ? (
                    <>
                      <DecorativeIcon icon="fullscreenExit" className="h-4 w-4" />
                      <span>Exit full screen</span>
                    </>
                  ) : (
                    <>
                      <DecorativeIcon icon="fullscreen" className="h-4 w-4" />
                      <span>Full screen</span>
                    </>
                  )}
              </NavLink>
          </div>
        )}
        <div
          className={`flex flex-col gap-6 ${isFullscreen ? 'grow' : ''}`}
        >
          {children}
        </div>
      </div>
      <ToastContainer />
    </main>
  )
}
