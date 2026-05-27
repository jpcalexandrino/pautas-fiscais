import React from "react"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useLocation, Link } from "@tanstack/react-router"

export function SiteHeader() {
  const location = useLocation()
  const pathnames = location.pathname.split("/").filter((x) => x)

  switch (pathnames[0]) {
    case "faturas":
      pathnames[0] = "Faturas";
      break;
    case "import":
      pathnames[0] = "Importação";
      break;
    case "data":
      pathnames[0] = "Dados";
      break;
    case "reports":
      pathnames[0] = "Relatórios";
      break;
    case "clients":
      pathnames[0] = "Clientes";
      break;
    case "equipment":
      pathnames[0] = "Equipamentos";
      break;
    case "users":
      pathnames[0] = "Usuários";
      break;
    default:
      break;
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-8"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {pathnames.length > 0 && <BreadcrumbSeparator className="hidden md:block" />}
            {pathnames.map((name, index) => {
              const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`
              const isLast = index === pathnames.length - 1
              const capitalized = name.charAt(0).toUpperCase() + name.slice(1)

              return (
                <React.Fragment key={routeTo}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{capitalized}</BreadcrumbPage>
                    ) : (
                      <>
                        <BreadcrumbLink asChild>
                          <Link to={routeTo as any}>{capitalized}</Link>
                        </BreadcrumbLink>
                        {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
                      </>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center ml-auto">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
