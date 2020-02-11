(* node.js readline class *)
type readline

(* bindings to event handler for 'close' and 'line' events *)
external on : 
  readline ->
    ([`close of unit -> unit 
    | `line of string -> unit] [@bs.string])
    -> readline = "on" [@@bs.send] 

(* register event handlers *)
let register rl =
  rl 
  |. on (`close (fun event -> () ))
  |. on (`line (fun line -> print_endline line))