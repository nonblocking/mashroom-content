
export default (id: string) => {
    const targetEL = document.getElementById(id);
    if (targetEL) {
        targetEL.scrollIntoView({
            block: 'start',
            behavior: 'smooth',
        });
    }
};
