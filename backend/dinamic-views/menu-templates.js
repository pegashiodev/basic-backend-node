

export const main_menu_basic = {

    html: `<button id="open-sidebar-button" onclick="openSidebar()" aria-label="open sidebar" aria-expanded="false" aria-controls="navbar">OPEN</button>
    <nav id="navbar">
        <ul class="first-lu">
            <li><button id="close-sidebar-button"  onclick="closeSidebar()" aria-label="close sidebar">CLOSE</button></li>
            <li class=""><a class="active-link" href="/">LOGO</a></li>
        </ul>
        <ul class="">
            <li class=""><a class="accent-link" aria-current="page" href="/access-platform">Acceder</a></li>
        </ul>
        <ul>
            <li><a href="/ejemplos-consultas-legales">Ejemplos</a></li>
            <li><a class="accent-link" href="/consulta-legal">Hacen una Consulta</a></li>
            <li><a href="/precios-consulta-legal">Precios</a></li>
            <li><a href="/como-funciona-consulta-legal">¿Cómo Funciona?</a></li>
        </ul>
    </nav>`,
    style: null,
    script: `const navbar = document.querySelector('#navbar')
        const openButton = document.querySelector("#open-sidebar-button")

        const media = window.matchMedia("(width>700px)")

        function openSidebar(){
            navbar.classList.add("show")
            openButton.setAttribute("aria-expanded", 'true')
            // navbar.removeAttribute("inert")
        }
        function closeSidebar(){
            navbar.classList.remove("show")
            openButton.setAttribute("aria-expanded", 'false')
            // navbar.setAttribute("inert", '')


        }

        // cuando la nevegacion es con link dentro de la pagina
        // al clicar en el menu para ir a una seccion
        // necesitamos que se cierre el menu y asi se hace
        const navLinks = document.querySelectorAll("nav a")
        navLinks.forEach(link=>{
            link.addEventListener("click", ()=>{
                closeSidebar()
            })
        })`,
    params: [],
    data_for_params: "USER"

}


export const main_menu_full = {

    html: `<button id="open-sidebar-button" onclick="openSidebar()" aria-label="open sidebar" aria-expanded="false" aria-controls="navbar">OPEN</button>
        <nav id="navbar">
            <ul class="first-lu">
                <li><button id="close-sidebar-button"  onclick="closeSidebar()" aria-label="close sidebar">CLOSE</button></li>
                <li class=""><a class="active-link" href="/">LOGO</a></li>
            </ul>
            <ul class="">
                <li class=""><a class="accent-link" aria-current="page" href="/access-platform">Acceder</a></li>
            </ul>
            <ul>
                <li><a href="/ejemplos-consultas-legales">Ejemplos</a></li>
                <li><a class="accent-link" href="/consulta-legal">Hacen una Consulta</a></li>
                <li><a href="/precios-consulta-legal">Precios</a></li>
                <li><a href="/como-funciona-consulta-legal">¿Cómo Funciona?</a></li>
            </ul>
            <ul id="user-zone" class="user-zone-wrap">
                <li><a href="">Tú Cuenta</a></li>
                <ul class="user-zone show">
                    <li><a href="#saldo">{{saldoCoins}}</a></li>
                    <li><a href="#historial">Historial</a></li>
                    <li><a href="#config">Configurar</a></li>
                    <li><a href="#recargar">Recargar</a></li>
                    <li><a href="#salir">Cerrar Session</a></li>
                </ul>
            </ul>

        </nav>

    <div id="overlay" onclick="closeSidebar()"></div>`,
    style: null,
    script: `const navbar = document.querySelector('#navbar')
        const openButton = document.querySelector("#open-sidebar-button")

        const media = window.matchMedia("(width>700px)")

        function openSidebar(){
            navbar.classList.add("show")
            openButton.setAttribute("aria-expanded", 'true')
            // navbar.removeAttribute("inert")
        }
        function closeSidebar(){
            navbar.classList.remove("show")
            openButton.setAttribute("aria-expanded", 'false')
            // navbar.setAttribute("inert", '')


        }

        // cuando la nevegacion es con link dentro de la pagina
        // al clicar en el menu para ir a una seccion
        // necesitamos que se cierre el menu y asi se hace
        const navLinks = document.querySelectorAll("nav a")
        navLinks.forEach(link=>{
            link.addEventListener("click", ()=>{
                closeSidebar()
            })
        })`,
    params: ["saldoCoins"],
    data_for_params: "USER"

}