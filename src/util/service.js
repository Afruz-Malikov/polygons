export const generateDarkHexColor = () => {
    const getRandomValue = () => Math.floor(Math.random() * 100); // 0-99 arasında değer
    const toHex = (value) => value.toString(16).padStart(2, "0"); // Hex formatına dönüştür

    const red = getRandomValue();
    const green = getRandomValue();
    const blue = getRandomValue();

    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
};