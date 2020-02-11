

external readFileSync :
  name:string -> ([`utf8 | `my_name [@bs.as "ascii"] ] [@bs.string]) ->
  string = "readFileSync"
  [@@bs.module "fs"]

let _ =
  readFileSync ~name:"xx.txt" `my_name
