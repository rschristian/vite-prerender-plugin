<template>
    <header>
        <nav>
            <RouterLink to="/" activeClass="active"> Home </RouterLink>
            <RouterLink to="/404" activeClass="active"> 404 </RouterLink>
        </nav>
    </header>
</template>

<style scoped>
header {
    display: flex;
    justify-content: flex-end;
    background-color: #41b883;
}

header nav {
    display: flex;
}

header a {
    color: #fff;
    padding: 0.75rem;
    text-decoration: none;
}

header a.active {
    background-color: #0005;
}

header a:hover {
    background-color: #0008;
}
</style>
