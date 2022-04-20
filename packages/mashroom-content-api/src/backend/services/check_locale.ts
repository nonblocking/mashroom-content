
export default (locale: string): boolean => {
    return !!locale.match(/[a-z]{2}/);
};
