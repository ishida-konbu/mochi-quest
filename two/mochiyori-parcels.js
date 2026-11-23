// A parcel enters the bag at the end of its source event and leaves at its destination.
function parcel(id, name, description, source, target, art) {
  return {id, name, description, source, target, art};
}

export const PARCELS = [
  parcel('ferry-leaf', '舟形の敷き葉', '籠の縁で拾った桜の葉。餅を載せた側には、葉脈がくっきり浮いている。', 'leaf-marks', 'joined-cake', 'leaf'),

  parcel('test-rice', '棚田の米二包み', 'みのりが一つの袋から量り分けた。古い蒸籠と新しい箱に一包みずつ使う。', 'same-rice', 'steam-test', 'rice'),
  parcel('steamer-bars', '蒸し箱の桟三本', '荷造り台の端で拾い上げた短い木。三本とも片側に同じ刻みがある。', 'packing-bars', 'steam-repair', 'bars'),

  parcel('wedding-print', '婚礼の餅底の写し', '白餡の祝い餅の底を描いた紙。右端に、針目のような小さな三角形がある。', 'wedding-filling', 'mended-cloth', 'sample'),
  parcel('trial-print', '薄野の餅底の写し', '望が店で出す胡桃餡の餅の底を描いた紙。三角の角まで写してある。', 'walnut-filling', 'mended-cloth', 'sample'),
  parcel('trial-cloth', 'おこげに借りた試し布', '二枚の写しを見たおこげが貸してくれた端切れ。望の蒸し布と同じ針目で繕ってある。', 'mended-cloth', 'cloth-test', 'cloth'),

  parcel('terrace-inquiry', 'みのりから八重への便り', '「米も道具も持参します。どこへ運びましょうか」。原本を八重に、控えをみのりの手に。', 'terrace-letter', 'changed-day', 'letter'),
  parcel('sakai-date', '堺へ届ける搬入日の知らせ', '祭の荷は、蔵を検分した翌朝に。積み順を決めるお澄への一通。', 'changed-day', 'ship-instruction', 'letter'),
  parcel('dawn-date', '浦へ届ける搬入日の知らせ', '餅を搗く日を決める朝吉とうめへの一通。二人が杵を置いてから読もう。', 'changed-day', 'dawn-delivery', 'letter'),
  parcel('inari-date', '稲荷へ届ける搬入日の知らせ', '陸路の荷を預かる結への一通。結はこれを読んでから箱に新しい日付を結ぶ。', 'changed-day', 'inari-delivery', 'letter'),

  parcel('mountain-tea-flask', '山茶の竹筒', '茶屋の亭主がもう一杯、竹筒に詰めてくれた。桃林で休む弥平と分けよう。', 'mountain-tea', 'rest-wish', 'tea'),
  parcel('coast-hinge', '松原で預かった蝶番', '波打ち際に残った金具。割れ口が細かく欠けていて、元の箱と合わせられる。', 'broken-hinge', 'matched-hinge', 'hinge'),
  parcel('salvaged-tools', '竜宮から松原へ返す道具包み', '漆筒の控えと数を合わせた敷板、丸皿、予備の祭札。包みの宛名は松原。', 'old-manifest', 'returned-tools', 'parcel'),

  parcel('purchase-copy', '蔵町の買い物控え', '豆蔵が複写してくれた祭道具一組の内訳。外箱を数えるだけでは、中身の数は分からない。', 'purchase-list', 'regional-returns', 'ledger'),
  parcel('tool-rubbing', '桜川の道具の墨拓', '板の角継ぎと、一本だけ端の欠けた桟。薄い紙に墨で形を取ったもの。', 'old-tool-marks', 'regional-returns', 'rubbing'),
  parcel('board-loan', '配膳板の貸出札の写し', '東大寺から薄野へ板二枚。貸した蓮照と運んだ大吉の名が並んでいる。', 'loaned-boards', 'regional-returns', 'tag'),
  parcel('regional-register', '十四組の照合帳', '三つの控えを各地の受取札と照らし合わせ、すずりが綴じた。最後の一行は京のために空いている。', 'regional-returns', 'end/mystery_06', 'ledger'),
  parcel('kyo-return-tag', '茶屋の返却札', '京の印を押した一組を茶屋で使用中。蔵へ返すのは検分の翌朝とある。', 'kyoto-set', 'end/mystery_06', 'tag'),

  parcel('winter-seal', 'お冬の花印を押した札', '今年は半分、ふたりで作る。お冬が先に印を押し、隣に弟子の名を入れる場所を残した。', 'joint-work', 'continued-work', 'seal'),
  parcel('makers-seals', 'ふたりの作り手札', 'お冬の花印の隣に、望が自分の印を押した。二人が引き受ける数が書いてある。', 'continued-work', 'end/mystery_07', 'seal'),
  parcel('receipt-copy', '受理記録の写し', '提出した人、日付、受け取った書類の見出し。すずりの記録を版元の注文控えと照らし合わせる。', 'submission-check', 'omission-copy', 'ledger'),
  parcel('print-order', '版元の注文控え', '版次が貸してくれた控え。新しい予定を添えないように頼んだのが誰か分かる。', 'omission-copy', 'end/mystery_07', 'letter'),

  parcel('peach-invite', '桃林への招待状', '桃林のみなさんへ。客として迎えたいと書いた封書に、桃の葉が一枚添えてある。', 'request/festival', 'peach-invitation', 'invitation'),
  parcel('palace-invite', '竜宮への招待状', '海底の竜宮のみなさんへ。水がしみないよう、油紙に包んで封をした。', 'request/festival', 'palace-invitation', 'invitation'),
  parcel('peach-reply', '桃の葉の返事', '桃子が桃の葉を添えた返事。弥平と一緒にお茶を飲みたい、と書いてある。', 'peach-invitation', 'end/festival', 'peach'),
  parcel('pearl-sample', '器を試す潮葛の真珠餅', '運ぶ器を試すため、小鞠が貝皿に載せて預けた真珠餅。堺の陶工のとわに届ける。', 'palace-invitation', 'lidded-bowl', 'pearl'),
  parcel('festival-bowl', '真珠餅の蓋付き水鉢', '堺のとわが選んだ蓋付きの器。京の卓に載せるまで、潮葛の餅をみずみずしく保つ。', 'lidded-bowl', 'end/festival', 'bowl'),
];
