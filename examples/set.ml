
module S = Belt.Set.Int
let data = [|1;2;3;4;4;3|]

let v  = S.fromArray data

let () = Js.log (S.toArray v)

module S0 = Belt.Set
module Id =
   Belt.Id.MakeComparableU(struct
    type t = int
    let cmp = fun[@bs] a b -> b - a
   end)


let v1 = S0.fromArray ~id:(module Id) data

let () = Js.log (S0.toArray v1)
