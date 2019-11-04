function escape(string) {
    return string.split('\\').join('\\\\');
}
console.log(escape(process.argv[2]));