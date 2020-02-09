Install dependecies

```sh
yarn
```

Generate calendar

```sh
yarn build && yarn start
```

CLI arguments

| Param name                  | Type    | Desciption                   |
| --------------------------- | ------- | ---------------------------- |
| --out, --dir, --outDir      | string  | Output directory             |
| --g, --group                | string  | Group identifier             |
| --no-lectures, --noLectures | boolean | Do not include lectures flag |

Результат упадет в `${outDir}/result_${Дата}_${Группа}.ics`
