export type Reading = {
  id: string
  title: string
  chapter?: number
  paragraphs: readonly string[]
}

export const readings: readonly Reading[] = [
  {
    id: 'a-big-family',
    title: 'A Big Family',
    chapter: 1,
    paragraphs: [
      'Dear Stephanie,',
      'How is Italy? Thanks a lot for your last letter.',
      'You asked about my family. There are eight people in my family. First, there’s my mother and father. My mother is a doctor, and my father is a police officer. I also have a brother and a sister.',
      'My grandmother and grandfather also live with us. My grandfather is a pilot. He flies planes. My grandmother is a chef. She cooks well. They are really kind. My aunt lives with us, too. She’s a singer. We are a big family!',
      'How about you? Do you have a big family?',
      'Write back soon,',
      'Jessica',
    ],
  },
  {
    id: 'getting-to-know-your-child',
    title: 'Getting to Know Your Child',
    chapter: 2,
    paragraphs: [
      'ATTENTION PARENTS - STUDENT INTRODUCTION',
      'To: Parent List 3rd Grade',
      'From: bsmith@rres.edu',
      'Dear parents,',
      'My name is Barbara Smith, the teacher of your child’s third-grade class. School is starting soon. Your child needs to be happy at school. Please answer a few questions about your child to help me get to know your child better.',
      '• What does your child do for fun?\n• Where does your child go after school?\n• What are your child’s favorite foods?\n• When is your child’s birthday?',
      'Also, your child needs the right supplies. Please get these things before the first day of school.',
      '• Please get your child a pen and pencils. Your child will write a lot.\n• Please get five notebooks for your child, one for each subject.\n• Please get four folders. Your child needs folders to keep their handouts.',
      'Please send these things and the answers to the questions above with your child on the first day of school, next Tuesday.',
      'Thank you,',
      'Barbara Smith',
    ],
  },
  {
    id: 'different-houses',
    title: 'Different Houses',
    chapter: 3,
    paragraphs: [
      'Fifty-six percent of the world’s people live in cities. Many people in the city live in apartments. Others live around cities, in smaller towns called suburbs. There are many houses in the suburbs. Outside of cities and suburbs is the countryside. The countryside has a lot of space, so there are big houses and even farms. Houses, apartments, and farms are not the only places where people live. Some people live in really different houses!',
      'A House on the Water',
      'The Drina River house is not a house beside the water. It’s a house over the water! This house is in Serbia. People love to visit and take photographs of it.',
      'Living in the Trees',
      'Treehouses are a lot of fun, but do you want to live in one? In Bali, Indonesia, you can try living in the famous Rumah Pohon Treehouse. There are three treehouses there that you can stay in. They are near the beautiful Diamond Beach.',
      'Cave Houses',
      'In Cappadocia, Turkey, you can find very different houses! Cappadocia has many cave houses. People made them inside large rocks. The rocks in Cappadocia are kind of soft. People have lived in these cave homes for thousands of years.',
    ],
  },
  {
    id: 'a-train-above-you',
    title: 'A Train above You',
    chapter: 4,
    paragraphs: [
      'The sun is shining, but you think you hear thunder. Look up! A train is passing over your head!',
      'Some big cities build train tracks above the city streets. One of these cities is Chicago. On the ground, cars and buses start and stop in traffic. Above them, trains are moving from station to station with no traffic jams.',
      'In Chicago, the overhead train is called the L. The tracks make a loop around the city center and then run out in all directions to the different parts of the city. The tracks are supported by massive steel columns.',
      'Riding the train is easy. Riders climb stairs or take an elevator from the sidewalk to the platform. They buy a ticket, go through a gate, and wait for the next train to take them where they want to go. A train ticket costs less than a taxi ride. At busy times, trains come as often as every ten minutes. At night and on weekends, they do not come as often. Some trains run all the time, day or night.',
      'While drivers on the ground are stuck in traffic, riders on the L are on their way. Students can do their homework or play a game on their phone. People read or talk. Some even go to sleep and wake up when they reach their stop.',
    ],
  },
  {
    id: 'birdwatching',
    title: 'Birdwatching',
    chapter: 5,
    paragraphs: [
      'Birdwatching can be a fun hobby for anyone. Birds are everywhere, and you can always find birds to watch in a city, in the countryside, on a mountain, or by the ocean. You can go birdwatching by yourself or with friends. Many people join birdwatching clubs. They love to go on bird walks as a group.',
      'Sometimes birders hike in the woods or up and down hills. That is good exercise. Sometimes they find a place to sit very still and listen to birds sing. If a bird’s call sounds close, the birder knows where to look. You can learn bird calls by listening to audio online.',
      'As a beginner, you need a field guide. That’s a book that tells about each kind of bird: what it eats, where it builds its nest, how it acts. How do you know what kind of bird you see? First, look for its size and shape. Then look at its color patterns.',
      'Birders collect birds. But they don’t catch them! They usually carry a diary or notebook to write down where and when they see each bird. They often take a photo or a video of the bird. Some birders draw a picture. They also write down what it is doing. They want to remember each bird. There is one thing they never do. A birder never hurts a bird!',
    ],
  },
  {
    id: 'street-food',
    title: 'Street Food',
    chapter: 7,
    paragraphs: [
      'Street food is food that cooks prepare outside and sell to the people passing by. Different countries have different street foods. Have you ever tried street food? What are some of your favorite street food?',
      'Mexico\nMexican street corn, called elotes, is corn on the cob cooked over very hot coals. It is covered with a lot of creamy sauce that has crumbled cheese, sour cream, and spices like chili. Eat this vegetable treat on a stick. Delicious!',
      'Middle East\nShawarma is many thin layers of spiced meat stacked on a spit. It is roasted slowly over hot coals and is very tender. It is popular all through the Middle East. It is usually served with pita bread.',
      'Great Britain\nFish and chips is popular everywhere in the British Isles. Chips is another name for french-fried potatoes. The dish is traditionally served in a cone of newspaper. It is good with salt and vinegar on it. Sometimes it comes with pieces of lemon or a little bit of tartar sauce.',
    ],
  },
  {
    id: 'around-the-world-right-now',
    title: 'Around the World Right Now',
    chapter: 8,
    paragraphs: [
      'If you could fly around the world right now, what would you see? In some places, it’s morning. In other places, it’s night. It’s hot in some places, and it’s cold in others. Let’s see what some kids are doing right now!',
      'Rome, Italy 7 a.m.\nIt’s early morning here. The sun is already warm. I feed cats near my home. These are not pet cats. They never come indoors. I save extra food for them. But I can never pick up a cat. The cats of Rome are wild!\n— Luisa',
      'Seoul, Korea 2 p.m.\nIt’s a cool afternoon here. I’m wearing long sleeves. I can play basketball with my friends. We don’t care who wins or who loses. We just have fun. It’s a good way to spend our free time.\n— Jin',
      'Chicago, USA midnight\nIt’s midnight. It’s cold, but I don’t mind. There are many shooting stars tonight. I can’t see them in the bright city. But I can go outside the city to see them. They sweep across the dark sky. It is quite a show!\n— Marilyn',
    ],
  },
  {
    id: 'ronas-diary',
    title: 'Rona’s Diary',
    chapter: 9,
    paragraphs: [
      'Saturday',
      'Whew, I’m tired! This week, I went to Colorado to visit my sister. We had such a good time, I didn’t want to leave. This morning, my sister got up and made pancakes for breakfast. We sat at the table and talked for a long time. Then I looked at the clock. “Oh no!” I shouted. “We’re late!” I took my suitcase, and we ran to my sister’s car. She drove very fast. At the airport, I hugged her. We said goodbye, and then I ran to the gate. My plane was ready to leave! The man at the gate saw me running. He held the door open for me. “Thank you!” I said. I got on the plane and sat in my seat. Soon we were flying. I was on my way home. What an exciting end to a wonderful trip!',
    ],
  },
  {
    id: 'climate-around-the-world',
    title: 'Climate Around the World',
    chapter: 10,
    paragraphs: [
      'Inga / Alta, Norway\nMy name is Inga, and I live in Norway, in a small town called Alta. We’re very far north! Here in the Arctic Circle, we have very cold winters. The temperature will drop below freezing. Skiing is popular. The weather is quite dry here, and it doesn’t rain very much. When it gets cold, we will dress in layers, starting with warm long underwear! Before I go outside, I put on my boblejakker. That means “bubble jacket.” It is thick and warm. Our summers are chilly, with a few warm days. Summer is sunny because the sun doesn’t set for about two months. After the sun sets, it doesn’t rise for about two months. During the dark winter months, we have beautiful views of the northern lights!',
      'Roger / Tristan da Cunha\nHello. My name is Roger, and I live next to a volcano! Tristan da Cunha is a small island in the Atlantic Ocean. Our island is very far from other countries. The average temperature is about fifteen degrees Celsius. Sometimes it will go up to about twenty-five degrees. It is very cloudy and rainy here, although it is not snowy. When it is windy, we often have strong storms. On this island, most people’s jobs are fishing or farming. I wear warm wool sweaters made from the sheep we raise. When volcano erupts, we will have to go away. But we will come back as soon as it is safe. Life can be hard here, but we love our home.',
    ],
  },
]
