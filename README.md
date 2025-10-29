# tela

An Electron application with React and TypeScript

### Install

```bash
$ yarn
```

### Development

```bash
$ yarn dev
```

### Features that work currently

Only the editor works

- Dynamic bottom sidebar that toggles between

  - file statistics (line, word, character counter)
  - scroll percentage when scrolling
  - suggested word to complete (can press tab character to complete word with suggestion)

- Creating and saving .md files and opening existing ones

  - CMD + 's' to save the file
  - CMD + 'o' to open an existing .md file

- File tree created on the left for header lines (lines that start with '#' or '##') (scrolling to the section is not working at the moment)

## Demo of features

1. Bottom sidebar

https://github.com/user-attachments/assets/39dde62b-fee2-406e-a02b-a380db8ae385

2.1 Save File

https://github.com/user-attachments/assets/40209b97-18d6-4e60-8726-087afc5145fc

2.2 Open File

https://github.com/user-attachments/assets/2c6150fe-f2d4-49a0-823a-f6cad4f797cd

3. File tree on Left sidebar

https://github.com/user-attachments/assets/714e7976-d2c7-40e9-82f8-812de6e9d395

### Build

```bash
# For windows
$ yarn build:win

# For macOS
$ yarn build:mac

# For Linux
$ yarn build:linux

# rebuild for mac arm64
$ yarn electron-builder --mac --arm64
```
