export function vigenereEncode(plaintext, keyword = "pluie") {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let encoded = '';

  for (let i = 0, j = 0; i < plaintext.length; i++) {
    const currentLetter = plaintext[i].toUpperCase();

    if (alphabet.includes(currentLetter)) {
      const shift = alphabet.indexOf(keyword[j % keyword.length].toUpperCase());
      const letterIndex = (alphabet.indexOf(currentLetter) + shift) % 26;
      encoded += alphabet[letterIndex];
      j++;
    } else {
      encoded += currentLetter; // Preserve non-alphabetic characters
    }
  }
  return encoded;
}

function vigenereDecode(ciphertext, keyword) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let decoded = '';

  for (let i = 0, j = 0; i < ciphertext.length; i++) {
    const currentLetter = ciphertext[i].toUpperCase();

    if (alphabet.includes(currentLetter)) {
      const shift = alphabet.indexOf(keyword[j % keyword.length].toUpperCase());
      const letterIndex = (alphabet.indexOf(currentLetter) - shift + 26) % 26;
      decoded += alphabet[letterIndex];
      j++;
    } else {
      decoded += currentLetter;
    }
  }
  return decoded;
}

// Example usage
const keyword = "pluie";
const originalText = "HELLO";
const encodedText = vigenereEncode(originalText, keyword);
const decodedText = vigenereDecode(encodedText, keyword);


// Function to randomly choose one, two, or three consecutive letters
export function getRandomOneTwoOrThreeLetters(textArray) {
  const length = textArray.length;
  const probability = 0; //Configured to 3 letters but can change !!!
  let selectedLetters = [];

  if (probability < 0.33 && length > 2) {
    // 33% chance to show 3 letters
    const startIndex = Math.floor(Math.random() * (length - 2));
    selectedLetters = [textArray[startIndex], textArray[startIndex + 1], textArray[startIndex + 2]];
  } else if (probability < 0.66 && length > 1) {
    // 33% chance to show 2 letters
    const startIndex = Math.floor(Math.random() * (length - 1));
    selectedLetters = [textArray[startIndex], textArray[startIndex + 1]];
  } else {
    // 34% chance to show 1 letter
    const index = Math.floor(Math.random() * length);
    selectedLetters = [textArray[index]];
  }

  return selectedLetters;
}


export function addSpacesBetweenLetters(lettersArray) {
  // Join the array of letters with a space
  return lettersArray.join(" ");
}
