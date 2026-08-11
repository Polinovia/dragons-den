import {
  PrismaClient,
  Visibility,
  StoryStatus,
  ContributorRole,
  ContentType,
  CollectionItemType,
  FriendshipStatus,
  NotificationType,
  SecurityQuestion,
} from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

async function main() {
  console.log("Clearing existing data...");
  await prisma.notification.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.contentTag.deleteMany();
  await prisma.collectionItem.deleteMany();
  await prisma.collectionContributor.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.storyContributor.deleteMany();
  await prisma.story.deleteMany();
  await prisma.sketch.deleteMany();
  await prisma.thought.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  console.log("Creating users...");
  const userDefs = [
    {
      username: "mira",
      email: "mira@example.com",
      displayName: "Mira Okafor",
      bio: "Writes ghosts who forgot they died. Collects overheard sentences.",
      pronouns: "she/her",
      location: "Lagos",
      avatarUrl: "/avatars/mira.svg",
      securityQuestion: SecurityQuestion.FIRST_PET,
      securityAnswer: "Whiskers",
    },
    {
      username: "theo",
      email: "theo@example.com",
      displayName: "Theo Lindqvist",
      bio: "Draws maps of places that don't exist yet. Slow, careful worldbuilder.",
      pronouns: "he/him",
      location: "Malmö",
      avatarUrl: "/avatars/theo.svg",
      securityQuestion: SecurityQuestion.CHILDHOOD_STREET,
      securityAnswer: "Storgatan",
    },
    {
      username: "priya",
      email: "priya@example.com",
      displayName: "Priya Raman",
      bio: "Flash fiction, mostly dialogue. If it can't be said out loud, I cut it.",
      pronouns: "she/her",
      location: "Chennai",
      avatarUrl: "/avatars/priya.svg",
      securityQuestion: SecurityQuestion.FAVORITE_TEACHER,
      securityAnswer: "Mrs Iyer",
    },
    {
      username: "sam",
      email: "sam@example.com",
      displayName: "Sam Osei",
      bio: "Poetry-adjacent thoughts at 2am. Occasional sketch when the thought grows legs.",
      pronouns: "they/them",
      location: "Accra",
      avatarUrl: "/avatars/sam.svg",
      securityQuestion: SecurityQuestion.FIRST_SCHOOL,
      securityAnswer: "Osu Presby",
    },
    {
      username: "jules",
      email: "jules@example.com",
      displayName: "Jules Bergström",
      bio: "Continues other people's stories more often than starting my own.",
      pronouns: "they/them",
      location: "Gothenburg",
      avatarUrl: "/avatars/jules.svg",
      securityQuestion: SecurityQuestion.MOTHERS_MAIDEN_NAME,
      securityAnswer: "Lindberg",
    },
    {
      username: "ana",
      email: "ana@example.com",
      displayName: "Ana Ferreira",
      bio: "Mood before plot, always. Still figuring out where that leads.",
      pronouns: "she/her",
      location: "Porto",
      avatarUrl: "/avatars/ana.svg",
      securityQuestion: SecurityQuestion.FIRST_PET,
      securityAnswer: "Pistachio",
    },
    {
      username: "kit",
      email: "kit@example.com",
      displayName: "Kit Vance",
      bio: "Small collector of phrases, maps, and unfinished things.",
      pronouns: "he/they",
      location: "Bristol",
      avatarUrl: "/avatars/kit.svg",
      securityQuestion: SecurityQuestion.CHILDHOOD_STREET,
      securityAnswer: "Elm Close",
    },
    {
      username: "noor",
      email: "noor@example.com",
      displayName: "Noor Haddad",
      bio: "Half-asleep thoughts that sometimes turn into something. New here.",
      pronouns: "she/her",
      location: "Amman",
      avatarUrl: "/avatars/noor.svg",
      securityQuestion: SecurityQuestion.FAVORITE_TEACHER,
      securityAnswer: "Mr Haddad",
    },
  ];

  const users: Record<string, { id: string }> = {};
  for (const def of userDefs) {
    const securityAnswerHash = await hashPassword(def.securityAnswer.trim().toLowerCase());
    const user = await prisma.user.create({
      data: {
        username: def.username,
        email: def.email,
        passwordHash,
        securityQuestion: def.securityQuestion,
        securityAnswerHash,
        profile: {
          create: {
            displayName: def.displayName,
            bio: def.bio,
            pronouns: def.pronouns,
            location: def.location,
            avatarUrl: def.avatarUrl,
          },
        },
      },
    });
    users[def.username] = user;
  }

  console.log("Creating friendships...");
  const acceptedPairs: [string, string][] = [
    ["mira", "theo"],
    ["mira", "priya"],
    ["mira", "sam"],
    ["mira", "jules"],
    ["theo", "priya"],
    ["theo", "ana"],
    ["priya", "sam"],
    ["priya", "kit"],
    ["sam", "jules"],
    ["sam", "noor"],
    ["jules", "ana"],
    ["ana", "kit"],
    ["kit", "noor"],
  ];
  for (const [a, b] of acceptedPairs) {
    await prisma.friendship.create({
      data: {
        requesterId: users[a].id,
        addresseeId: users[b].id,
        status: FriendshipStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });
  }
  await prisma.friendship.create({
    data: {
      requesterId: users.noor.id,
      addresseeId: users.mira.id,
      status: FriendshipStatus.PENDING,
    },
  });

  console.log("Creating tags...");
  const tagDefs = ["ghosts", "worldbuilding", "flash-fiction", "trains", "fantasy", "liminal"];
  const tags: Record<string, { id: string }> = {};
  for (const name of tagDefs) {
    tags[name] = await prisma.tag.create({ data: { name, slug: slugify(name) } });
  }

  console.log("Creating sketches (branching trees + standalone)...");

  // Tree A: 1 root + 3 sibling continuations
  const trainRoot = await prisma.sketch.create({
    data: {
      title: "The Night Train",
      body: "She woke up on a train, but couldn't remember where it was going.",
      authorId: users.mira.id,
      visibility: Visibility.PUBLIC,
    },
  });
  await prisma.contentTag.create({
    data: { tagId: tags["trains"].id, contentType: ContentType.SKETCH, sketchId: trainRoot.id },
  });
  await prisma.contentTag.create({
    data: { tagId: tags["liminal"].id, contentType: ContentType.SKETCH, sketchId: trainRoot.id },
  });

  const trainByTheo = await prisma.sketch.create({
    data: {
      title: null,
      body: "The conductor had no face she could remember afterward, only a voice that said, 'Everyone gets off eventually. You're just early.'",
      authorId: users.theo.id,
      parentId: trainRoot.id,
      visibility: Visibility.PUBLIC,
    },
  });
  const trainByPriya = await prisma.sketch.create({
    data: {
      title: null,
      body: "\"Where are we going?\" she asked the woman across the aisle.\n\"Wherever you were already headed,\" the woman said, not looking up from her book. \"That's the trouble with trains like this one.\"",
      authorId: users.priya.id,
      parentId: trainRoot.id,
      visibility: Visibility.PUBLIC,
    },
  });
  await prisma.sketch.create({
    data: {
      title: null,
      body: "She pressed her hand to the window. Outside, the landscape kept almost becoming her childhood street, then changing its mind.",
      authorId: users.jules.id,
      parentId: trainRoot.id,
      visibility: Visibility.PUBLIC,
    },
  });

  // Tree B: 1 root + 1 child + 1 grandchild
  const windowsRoot = await prisma.sketch.create({
    data: {
      title: "Windows",
      body: "The lights in the apartment across the street turned on one by one.\nSomeone was spelling a message.",
      authorId: users.sam.id,
      visibility: Visibility.PUBLIC,
    },
  });
  await prisma.contentTag.create({
    data: { tagId: tags["liminal"].id, contentType: ContentType.SKETCH, sketchId: windowsRoot.id },
  });

  const windowsByAna = await prisma.sketch.create({
    data: {
      title: null,
      body: "By the third floor she had counted eleven letters. Not a word yet. She kept the light off in her own apartment so she could watch without being read in return.",
      authorId: users.ana.id,
      parentId: windowsRoot.id,
      visibility: Visibility.PUBLIC,
    },
  });
  const windowsByKit = await prisma.sketch.create({
    data: {
      title: null,
      body: "The message finished at midnight. It wasn't a word at all — it was a shape, the outline of a door that had never been on that building before.",
      authorId: users.kit.id,
      parentId: windowsByAna.id,
      visibility: Visibility.PUBLIC,
    },
  });

  // Standalone sketches across visibility tiers
  const mirasPrivateSketch = await prisma.sketch.create({
    data: {
      title: "Draft: the funeral that wasn't",
      body: "He kept setting a second cup of coffee out of habit. Nobody at the table minded. Nobody at the table was really there.",
      authorId: users.mira.id,
      visibility: Visibility.PRIVATE,
    },
  });
  await prisma.contentTag.create({
    data: { tagId: tags["ghosts"].id, contentType: ContentType.SKETCH, sketchId: mirasPrivateSketch.id },
  });

  const theosFriendsSketch = await prisma.sketch.create({
    data: {
      title: "Coastline, unfinished",
      body: "I keep redrawing the coastline of the northern continent. Every version puts a different village underwater.",
      authorId: users.theo.id,
      visibility: Visibility.FRIENDS,
    },
  });
  await prisma.contentTag.create({
    data: { tagId: tags["worldbuilding"].id, contentType: ContentType.SKETCH, sketchId: theosFriendsSketch.id },
  });

  const priyasPublicSketch = await prisma.sketch.create({
    data: {
      title: "Waiting room",
      body: "\"You go first,\" she said.\n\"You always say that.\"\n\"It's always true.\"",
      authorId: users.priya.id,
      visibility: Visibility.PUBLIC,
    },
  });
  await prisma.contentTag.create({
    data: { tagId: tags["flash-fiction"].id, contentType: ContentType.SKETCH, sketchId: priyasPublicSketch.id },
  });

  await prisma.sketch.create({
    data: {
      title: null,
      body: "Notebook scrap: a lighthouse that only works if nobody is looking directly at it.",
      authorId: users.kit.id,
      visibility: Visibility.PRIVATE,
    },
  });

  await prisma.sketch.create({
    data: {
      title: "First post",
      body: "New here, mostly lurking. This is a sketch about a door in a kitchen wall that definitely wasn't there yesterday.",
      authorId: users.noor.id,
      visibility: Visibility.PUBLIC,
    },
  });

  console.log("Creating story with chapters and a contributor...");
  const storyTitle = "The Cartographer's Daughter";
  const story = await prisma.story.create({
    data: {
      title: storyTitle,
      slug: slugify(storyTitle),
      synopsis:
        "A cartographer's daughter inherits her mother's unfinished map of a continent that keeps rearranging itself — and a friend who insists on filling in the missing coastline.",
      status: StoryStatus.ONGOING,
      visibility: Visibility.PUBLIC,
      allowContributions: true,
      authorId: users.theo.id,
    },
  });
  await prisma.storyContributor.create({
    data: { storyId: story.id, userId: users.theo.id, role: ContributorRole.OWNER },
  });
  await prisma.storyContributor.create({
    data: { storyId: story.id, userId: users.priya.id, role: ContributorRole.CONTRIBUTOR },
  });
  await prisma.contentTag.create({
    data: { tagId: tags["worldbuilding"].id, contentType: ContentType.STORY, storyId: story.id },
  });
  await prisma.contentTag.create({
    data: { tagId: tags["fantasy"].id, contentType: ContentType.STORY, storyId: story.id },
  });

  const chapterDefs = [
    {
      title: "The Map That Lied",
      authorId: users.theo.id,
      body: "Elin found the map in the bottom drawer, under her mother's gloves. It was seventy years old and, impossibly, still changing.",
    },
    {
      title: "The Village That Wasn't Drowned Yet",
      authorId: users.priya.id,
      body: "\"You're sure this village is still here?\" Elin asked.\n\"I'm sure of nothing,\" said the ferryman. \"That's why I still have a job.\"",
    },
    {
      title: "What the Ink Remembers",
      authorId: users.theo.id,
      body: "Every redraw left a ghost of the old coastline beneath the new one, faint as a held breath. Elin started reading the ghosts instead of the map.",
    },
    {
      title: "A Coastline Held Still",
      authorId: users.priya.id,
      body: "For one night, for reasons neither of them understood, the map stopped moving. Elin traced the coast with her finger like she was trying to memorize a face.",
    },
  ];
  const chapters = [];
  for (let i = 0; i < chapterDefs.length; i++) {
    const def = chapterDefs[i];
    const chapter = await prisma.chapter.create({
      data: {
        storyId: story.id,
        authorId: def.authorId,
        title: def.title,
        slug: slugify(def.title),
        body: def.body,
        order: i + 1,
      },
    });
    chapters.push(chapter);
  }

  console.log("Creating thoughts across visibility tiers...");
  await prisma.thought.create({
    data: {
      body: "Note to self: finish the train story before Sunday, before I lose the ending I already know.",
      authorId: users.mira.id,
      visibility: Visibility.PRIVATE,
    },
  });
  await prisma.thought.create({
    data: {
      body: "Not sure if the second draft is better, or just different. Sitting with that for a while.",
      authorId: users.sam.id,
      visibility: Visibility.PRIVATE,
    },
  });
  const timelinesThought = await prisma.thought.create({
    data: {
      body: "What if the train is actually moving through different timelines?",
      authorId: users.jules.id,
      visibility: Visibility.FRIENDS,
    },
  });
  await prisma.thought.create({
    data: {
      body: "Wondering if a story can have a mood without a plot. Or if that's just called a photograph.",
      authorId: users.ana.id,
      visibility: Visibility.FRIENDS,
    },
  });
  await prisma.thought.create({
    data: {
      body: "Half-asleep thought: what if the message in the windows spells a language nobody has invented yet?",
      authorId: users.noor.id,
      visibility: Visibility.FRIENDS,
    },
  });
  const phrasesThought = await prisma.thought.create({
    data: {
      body: "Small collection of phrases I overheard this week: 'that's a bridge we haven't burned yet,' 'it only looks abandoned,' 'save some for the walk back.'",
      authorId: users.kit.id,
      visibility: Visibility.PUBLIC,
    },
  });
  await prisma.thought.create({
    data: {
      body: "Dialogue that never made it into anything: \"You already knew the answer. You just needed someone else to say it out loud.\"",
      authorId: users.priya.id,
      visibility: Visibility.PUBLIC,
    },
  });

  console.log("Creating collections...");
  const fantasyWorld = await prisma.collection.create({
    data: {
      name: "Fantasy World",
      description: "A slowly-accumulating continent: maps, characters, and the stories that happen on its coastline.",
      visibility: Visibility.PUBLIC,
      ownerId: users.theo.id,
    },
  });
  await prisma.collectionItem.create({
    data: {
      collectionId: fantasyWorld.id,
      itemType: CollectionItemType.STORY,
      storyId: story.id,
      order: 0,
      addedById: users.theo.id,
    },
  });
  await prisma.collectionItem.create({
    data: {
      collectionId: fantasyWorld.id,
      itemType: CollectionItemType.SKETCH,
      sketchId: windowsRoot.id,
      order: 1,
      addedById: users.theo.id,
    },
  });
  await prisma.collectionItem.create({
    data: {
      collectionId: fantasyWorld.id,
      itemType: CollectionItemType.NOTE,
      noteTitle: "Elin Kestrel",
      noteBody: "Cartographer's apprentice. Draws maps of places that haven't happened yet. Trusts ink more than people.",
      order: 2,
      addedById: users.theo.id,
    },
  });

  const summerCollection = await prisma.collection.create({
    data: {
      name: "Summer 2026",
      description: "Everything written between June and September. Mostly trains, apparently.",
      visibility: Visibility.PUBLIC,
      ownerId: users.mira.id,
    },
  });
  await prisma.collectionContributor.create({
    data: { collectionId: summerCollection.id, userId: users.priya.id, role: ContributorRole.CONTRIBUTOR },
  });
  await prisma.collectionItem.create({
    data: {
      collectionId: summerCollection.id,
      itemType: CollectionItemType.SKETCH,
      sketchId: trainRoot.id,
      order: 0,
      addedById: users.mira.id,
    },
  });
  await prisma.collectionItem.create({
    data: {
      collectionId: summerCollection.id,
      itemType: CollectionItemType.SKETCH,
      sketchId: trainByPriya.id,
      order: 1,
      addedById: users.priya.id,
    },
  });
  await prisma.collectionItem.create({
    data: {
      collectionId: summerCollection.id,
      itemType: CollectionItemType.SKETCH,
      sketchId: priyasPublicSketch.id,
      order: 2,
      addedById: users.mira.id,
    },
  });

  console.log("Creating comments and likes...");
  await prisma.comment.create({
    data: {
      body: "The 'you're just early' line is doing so much work. Love this.",
      authorId: users.priya.id,
      contentType: ContentType.SKETCH,
      sketchId: trainByTheo.id,
    },
  });
  const rootComment = await prisma.comment.create({
    data: {
      body: "I did not expect three different directions from one sentence. This is exactly the point of this place.",
      authorId: users.jules.id,
      contentType: ContentType.SKETCH,
      sketchId: trainRoot.id,
    },
  });
  await prisma.comment.create({
    data: {
      body: "Agreed — going to reread all three back to back now.",
      authorId: users.mira.id,
      contentType: ContentType.SKETCH,
      sketchId: trainRoot.id,
      parentId: rootComment.id,
    },
  });
  await prisma.comment.create({
    data: {
      body: "The ghost coastline detail is going to stay with me.",
      authorId: users.mira.id,
      contentType: ContentType.STORY,
      storyId: story.id,
    },
  });

  const likeTargets: { userId: string; sketchId?: string; storyId?: string; thoughtId?: string }[] = [
    { userId: users.theo.id, sketchId: trainRoot.id },
    { userId: users.priya.id, sketchId: trainRoot.id },
    { userId: users.jules.id, sketchId: trainRoot.id },
    { userId: users.mira.id, sketchId: trainByTheo.id },
    { userId: users.kit.id, sketchId: windowsByKit.id },
    { userId: users.ana.id, sketchId: windowsRoot.id },
    { userId: users.priya.id, storyId: story.id },
    { userId: users.mira.id, storyId: story.id },
    { userId: users.sam.id, thoughtId: phrasesThought.id },
    { userId: users.jules.id, thoughtId: timelinesThought.id },
  ];
  for (const like of likeTargets) {
    await prisma.like.create({ data: { ...like, contentType: like.sketchId ? ContentType.SKETCH : like.storyId ? ContentType.STORY : ContentType.THOUGHT } });
  }

  console.log("Creating notifications...");
  await prisma.notification.create({
    data: {
      recipientId: users.mira.id,
      actorId: users.theo.id,
      type: NotificationType.CONTINUATION,
      message: "Theo Lindqvist continued your sketch \"The Night Train\"",
      link: `/sketches/${trainByTheo.id}`,
    },
  });
  await prisma.notification.create({
    data: {
      recipientId: users.mira.id,
      actorId: users.priya.id,
      type: NotificationType.CONTINUATION,
      message: "Priya Raman continued your sketch \"The Night Train\"",
      link: `/sketches/${trainByPriya.id}`,
    },
  });
  await prisma.notification.create({
    data: {
      recipientId: users.theo.id,
      actorId: users.priya.id,
      type: NotificationType.CONTRIBUTOR_ADDED,
      message: "Priya Raman joined your story \"The Cartographer's Daughter\" as a contributor",
      link: `/stories/${story.slug}`,
    },
  });
  await prisma.notification.create({
    data: {
      recipientId: users.mira.id,
      actorId: users.noor.id,
      type: NotificationType.FRIEND_REQUEST,
      message: "Noor Haddad sent you a friend request",
      link: `/profile/noor`,
      isRead: false,
    },
  });

  console.log("Seed complete.");
  console.log(`Demo users (password for all: "${DEMO_PASSWORD}"):`);
  for (const def of userDefs) {
    console.log(`  ${def.email}  (@${def.username})  security question: ${def.securityQuestion} = "${def.securityAnswer}"`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
