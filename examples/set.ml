
module S = Belt.Set.Int 
let data = [|1;2;3;4;4;3|]

let v  = S.ofArray data 

let () = Js.log (S.toArray v)

module S0 = Belt.Set
module Id = 
  (val Belt.Id.comparableU 
    ~cmp:(fun[@bs] (a : int) b -> b - a))

let v1 = S0.ofArray ~id:(module Id) data

let () = Js.log (S0.toArray v1)