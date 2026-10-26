import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();

const HEADER = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*`;
const FOOTER = `*───━━━⊱  𝐒 𝐎 𝐋 𝐎  ⊰━━━───*
*~『𝑺𝑶𝑳𝑶⊰🏮⊱𝑳𝑬𝑽𝑬𝑳𝑰𝑵𝑮』~*`;
const DIVIDER = `*⎔┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄⎔*`;

export default {
  name: "ملفات",
  description: "نظام إدارة ملفات شامل",
  usage: ".ملفات [قائمة|فتح|عرض|اضافه|حذف|تعديل|تغيير|انشاء|تحديث] ...",
  developer: true,

  async run({ message, reply, args, handler, downloadMedia, sock }) {
    try {
      const sub = args?.[0]?.toLowerCase() || 'قائمة';

      // ============================================================
      // 🔢 ترتيب موحد للملفات والمجلدات
      // ============================================================

      async function getEntries(dir) {
        let names = await fsp.readdir(dir, { withFileTypes: true });

        return names.sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;

          return a.name.localeCompare(b.name, 'ar', {
            numeric: true,
            sensitivity: 'base'
          });
        });
      }

      // ============================================================
      // 📊 معلومات الملف
      // ============================================================

      async function safeStat(p) {
        try {
          return await fsp.stat(p);
        } catch {
          return null;
        }
      }

      // ============================================================
      // 📋 قائمة الجذر
      // ============================================================

      async function listRoot() {
        const names = await getEntries(ROOT);

        let out = `${HEADER}

*📂 مـديـر مـلـفـات 𝐒𝐎𝐋𝐎*

${DIVIDER}

*📍 الـمـسـار:*
\`${ROOT}\`

${DIVIDER}

`;

        if (!names.length) {
          out += `*📭 الـجـذر فـارغ حـالـيـاً*\n`;
        } else {
          names.forEach((item, index) => {
            const number = index + 1;

            if (item.isDirectory()) {
              out += `*${number}.* 📁 *${item.name}*\n`;
              out += `   └─ *مـجـلـد*\n\n`;
            } else {
              const ext = path.extname(item.name) || 'بدون امتداد';
              out += `*${number}.* 📄 *${item.name}*\n`;
              out += `   └─ *${ext}*\n\n`;
            }
          });
        }

        out += `${DIVIDER}

*⚙️ الأوامـر:*

*📂 ملفات فتح* \`رقم\`
> فـتـح مـجـلـد

*📄 ملفات عرض* \`رقم\`
> عـرض مـحـتـوى مـلـف

*➕ ملفات اضافه* \`رقم اسم\`
> إضـافـة مـلـف

*✏️ ملفات تعديل* \`رقم\`
> تـعـديـل مـلـف

*🗑️ ملفات حذف* \`رقم\`
> حـذف مـلـف أو مـجـلـد

*🔄 ملفات تغيير* \`رقم الاسم\`
> تـغـيـيـر الاسـم

*📁 ملفات انشاء* \`اسم\`
> إنـشـاء مـجـلـد

*♻️ ملفات تحديث*
> إعـادة تـحـمـيـل الـبـلـجـنـات

${FOOTER}`;

        return out;
      }

      // ============================================================
      // 🔍 تحويل رقم الجذر إلى مسار
      // ============================================================

      async function resolveIndex(num) {
        const names = await getEntries(ROOT);
        const idx = parseInt(num, 10) - 1;

        if (isNaN(idx) || idx < 0 || idx >= names.length) {
          return null;
        }

        const entry = names[idx];

        return {
          path: path.join(ROOT, entry.name),
          name: entry.name,
          isDir: entry.isDirectory(),
          parent: ROOT
        };
      }

      // ============================================================
      // 🔍 تحويل مسار مثل 3/5
      // ============================================================

      async function resolveCompound(spec) {
        const parts = String(spec).split('/');

        if (parts.length === 1) {
          const root = await resolveIndex(parts[0]);

          return {
            type: root ? (root.isDir ? 'dir' : 'file') : null,
            resolved: root
          };
        }

        if (parts.length !== 2) {
          return { type: null, resolved: null };
        }

        const folder = await resolveIndex(parts[0]);

        if (!folder || !folder.isDir) {
          return { type: null, resolved: null };
        }

        const names = await getEntries(folder.path);
        const idx = parseInt(parts[1], 10) - 1;

        if (isNaN(idx) || idx < 0 || idx >= names.length) {
          return { type: null, resolved: null };
        }

        const entry = names[idx];

        return {
          type: entry.isDirectory() ? 'dir' : 'file',
          resolved: {
            path: path.join(folder.path, entry.name),
            name: entry.name,
            isDir: entry.isDirectory(),
            parent: folder.path
          }
        };
      }

      // ============================================================
      // 📂 فتح مجلد
      // ============================================================

      async function openFolderByIndex(num) {
        const folder = await resolveIndex(num);

        if (!folder) {
          return `*❌ الـمـجـلـد رقـم ${num} غـيـر مـوجـود*`;
        }

        if (!folder.isDir) {
          return `*❌ الـعـنـصـر رقـم ${num} لـيـس مـجـلـداً*`;
        }

        const names = await getEntries(folder.path);

        let out = `${HEADER}

*📂 مـجـلـد:* \`${folder.name}\`

${DIVIDER}

`;

        if (!names.length) {
          out += `*📭 الـمـجـلـد فـارغ*\n`;
        } else {
          names.forEach((item, index) => {
            const number = index + 1;

            if (item.isDirectory()) {
              out += `*${number}.* 📁 *${item.name}*\n`;
            } else {
              out += `*${number}.* 📄 *${item.name}*\n`;
            }
          });
        }

        out += `
${DIVIDER}

*📌 لـعـرض مـلـف:*
\`.ملفات عرض ${num}/رقم\`

*✏️ لـتـعـديـل مـلـف:*
\`.ملفات تعديل ${num}/رقم\`

*🗑️ لـحـذف:*
\`.ملفات حذف ${num}/رقم\`

${FOOTER}`;

        return out;
      }

      // ============================================================
      // 📄 قراءة محتوى ملف
      // ============================================================

      async function readTextFile(filePath, fileName) {
        const ext = path.extname(fileName).toLowerCase();
        const textExtensions = [
          '.js',
          '.json',
          '.txt',
          '.md',
          '.html',
          '.css',
          '.json5',
          '.xml',
          '.yml',
          '.yaml'
        ];

        if (!textExtensions.includes(ext)) {
          return null;
        }

        const txt = await fsp.readFile(filePath, 'utf8');

        return `*📄 الـمـلـف:* \`${fileName}\`

\`\`\`javascript
${txt.slice(0, 12000)}
\`\`\``;
      }

      // ============================================================
      // 👁️ عرض ملف
      // ============================================================

      async function viewFile(spec) {
        const result = await resolveCompound(spec);

        if (!result?.resolved) {
          return `*❌ الـمـسـار ${spec} غـيـر مـوجـود*`;
        }

        const resolved = result.resolved;

        if (result.type === 'dir') {
          const names = await getEntries(resolved.path);

          let out = `${HEADER}

*📂 مـحـتـويـات:* \`${resolved.name}\`

${DIVIDER}

`;

          if (!names.length) {
            out += `*📭 الـمـجـلـد فـارغ*`;
          } else {
            names.forEach((item, index) => {
              out += `*${index + 1}.* ${item.isDirectory() ? '📁' : '📄'} *${item.name}*\n`;
            });
          }

          return out;
        }

        const textContent = await readTextFile(
          resolved.path,
          resolved.name
        );

        if (textContent) {
          return textContent;
        }

        await sock.sendMessage(
          message.key.remoteJid,
          {
            document: { url: resolved.path },
            fileName: resolved.name
          },
          { quoted: message }
        );

        return `*✅ تـم إرسـال الـمـلـف:* \`${resolved.name}\``;
      }

      // ============================================================
      // ➕ إضافة ملف
      // ============================================================

      async function addFile(cmdArgs) {
        const folderIndex = cmdArgs[0];
        const fileNameArg = cmdArgs.slice(1).join(' ');

        if (!folderIndex || !fileNameArg) {
          return `*❌ الاستخدام:*
\`.ملفات اضافه رقم اسم_الملف\``;
        }

        const folder = await resolveIndex(folderIndex);

        if (!folder) {
          return `*❌ الـمـجـلـد رقـم ${folderIndex} غـيـر مـوجـود*`;
        }

        if (!folder.isDir) {
          return `*❌ الـعـنـصـر رقـم ${folderIndex} لـيـس مـجـلـداً*`;
        }

        let ext = path.extname(fileNameArg);
        let fileName = fileNameArg;

        if (!ext) {
          const lname = folder.name.toLowerCase();

          if (
            lname.includes('plugin') ||
            lname.includes('plugins')
          ) {
            ext = '.js';
          } else if (lname.includes('data')) {
            ext = '.json';
          } else {
            ext = '.js';
          }

          fileName += ext;
        }

        const filePath = path.join(
          folder.path,
          fileName
        );

        const quoted =
          message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        let content = null;

        if (quoted?.conversation) {
          content = quoted.conversation;
        } else if (quoted?.extendedTextMessage?.text) {
          content = quoted.extendedTextMessage.text;
        }

        if (!content && quoted) {
          try {
            const buf = await downloadMedia(message);

            if (buf) {
              await fsp.writeFile(filePath, buf);

              return `*✅ تـمـت إضـافـة الـمـلـف*

*📄 الـمـلـف:* \`${fileName}\`
*📂 الـمـجـلـد:* \`${folder.name}\``;
            }
          } catch {}
        }

        if (content === null) {
          content = '';
        }

        await fsp.writeFile(
          filePath,
          content,
          'utf8'
        );

        return `*✅ تـم إنـشـاء الـمـلـف*

*📄 الـمـلـف:* \`${fileName}\`
*📂 الـمـجـلـد:* \`${folder.name}\``;
      }

      // ============================================================
      // ✏️ تعديل ملف
      // ============================================================

      async function editFile(spec) {
        const result = await resolveCompound(spec);

        if (!result?.resolved) {
          return `*❌ الـمـسـار ${spec} غـيـر مـوجـود*`;
        }

        if (result.type === 'dir') {
          return `*❌ لا يـمـكـن تـعـديـل مـجـلـد*`;
        }

        const resolved = result.resolved;

        const quoted =
          message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted) {
          return `*❌ رد عـلى رسـالـة تـحـتـوي الـمـحـتـوى الـجـديـد لـلـمـلـف*`;
        }

        let content = null;

        if (quoted.conversation) {
          content = quoted.conversation;
        } else if (quoted.extendedTextMessage?.text) {
          content = quoted.extendedTextMessage.text;
        }

        if (content !== null) {
          await fsp.writeFile(
            resolved.path,
            content,
            'utf8'
          );

          return `*✅ تـم تـعـديـل الـمـلـف*

*📄 الـمـلـف:* \`${resolved.name}\``;
        }

        try {
          const buf = await downloadMedia(message);

          if (!buf) {
            return `*❌ فـشـل تـحـمـيـل الـوسـيـط*`;
          }

          await fsp.writeFile(
            resolved.path,
            buf
          );

          return `*✅ تـم تـعـديـل الـمـلـف*

*📄 الـمـلـف:* \`${resolved.name}\``;
        } catch {
          return `*❌ فـشـل تـعـديـل الـمـلـف*`;
        }
      }

      // ============================================================
      // 🗑️ حذف ملف أو مجلد
      // ============================================================

      async function deleteSpec(spec) {
        const result = await resolveCompound(spec);

        if (!result?.resolved) {
          return `*❌ الـمـسـار ${spec} غـيـر مـوجـود*`;
        }

        const resolved = result.resolved;
        const stat = await safeStat(resolved.path);

        if (!stat) {
          return `*❌ الـمـسـار غـيـر مـوجـود*`;
        }

        if (stat.isDirectory()) {
          await fsp.rm(
            resolved.path,
            {
              recursive: true,
              force: true
            }
          );

          return `*🗑️ تـم حـذف الـمـجـلـد*

*📂:* \`${resolved.name}\``;
        }

        await fsp.unlink(resolved.path);

        return `*🗑️ تـم حـذف الـمـلـف*

*📄:* \`${resolved.name}\``;
      }

      // ============================================================
      // 🔄 تغيير الاسم
      // ============================================================

      async function renameSpec(spec, newName) {
        const result = await resolveCompound(spec);

        if (!result?.resolved) {
          return `*❌ الـمـسـار ${spec} غـيـر مـوجـود*`;
        }

        if (!newName) {
          return `*❌ اكـتـب الاسـم الـجـديـد*`;
        }

        const resolved = result.resolved;

        const cleanName = path.basename(newName);

        if (!cleanName || cleanName === '.' || cleanName === '..') {
          return `*❌ اسـم غـيـر صـالـح*`;
        }

        const newPath = path.join(
          path.dirname(resolved.path),
          cleanName
        );

        if (await safeStat(newPath)) {
          return `*❌ يـوجـد مـلـف أو مـجـلـد بـهـذا الاسـم مـسـبـقـاً*`;
        }

        await fsp.rename(
          resolved.path,
          newPath
        );

        return `*🔄 تـم تـغـيـيـر الاسـم*

*قبل:* \`${resolved.name}\`
*بعد:* \`${cleanName}\``;
      }

      // ============================================================
      // 📁 إنشاء مجلد
      // ============================================================

      async function createFolder(createArgs) {
        if (!createArgs?.length) {
          return `*❌ الاستخدام:*
\`.ملفات انشاء اسم\`
أو
\`.ملفات انشاء رقم اسم\``;
        }

        if (createArgs.length === 1) {
          const name = path.basename(createArgs[0]);
          const folderPath = path.join(ROOT, name);

          if (await safeStat(folderPath)) {
            return `*❌ هـذا الـمـسـار مـوجـود بـالـفـعـل*`;
          }

          await fsp.mkdir(
            folderPath,
            { recursive: true }
          );

          return `*📁 تـم إنـشـاء الـمـجـلـد*

*الاسـم:* \`${name}\``;
        }

        const index = createArgs[0];
        const folder = await resolveIndex(index);

        if (!folder || !folder.isDir) {
          return `*❌ الـمـجـلـد رقـم ${index} غـيـر مـوجـود*`;
        }

        const name = path.basename(
          createArgs.slice(1).join(' ')
        );

        const folderPath = path.join(
          folder.path,
          name
        );

        if (await safeStat(folderPath)) {
          return `*❌ هـذا الـمـسـار مـوجـود بـالـفـعـل*`;
        }

        await fsp.mkdir(
          folderPath,
          { recursive: true }
        );

        return `*📁 تـم إنـشـاء الـمـجـلـد*

*الاسـم:* \`${name}\`
*داخـل:* \`${folder.name}\``;
      }

      // ============================================================
      // ♻️ تحديث البلجنات
      // ============================================================

      async function updateAll() {
        if (
          handler &&
          typeof handler.reloadAllPlugins === 'function'
        ) {
          await handler.reloadAllPlugins();

          return `*♻️ تـم إعـادة تـحـمـيـل جـمـيـع الـبـلـجـنـات*`;
        }

        if (
          handler &&
          typeof handler.loadPlugins === 'function'
        ) {
          await handler.loadPlugins();

          return `*♻️ تـم تـحـديـث الـبـلـجـنـات*`;
        }

        return `*⚠️ لا تـوجـد دالـة تـحـديـث مـتـاحـة فـي الـهـانـدلـر*`;
      }

      // ============================================================
      // 🚀 تنفيذ الأمر
      // ============================================================

      switch (sub) {
        case 'قائمة':
        case '':
          return reply(await listRoot());

        case 'فتح': {
          const num = args[1];

          if (!num) {
            return reply(`*❌ استخدم:*
\`.ملفات فتح رقم\``);
          }

          return reply(
            await openFolderByIndex(num)
          );
        }

        case 'عرض': {
          const spec = args[1];

          if (!spec) {
            return reply(`*❌ استخدم:*
\`.ملفات عرض رقم\`
أو
\`.ملفات عرض مجلد/رقم\``);
          }

          return reply(
            await viewFile(spec)
          );
        }

        case 'اضافه':
        case 'اضافة': {
          const rest = args.slice(1);

          if (rest.length < 2) {
            return reply(`*❌ استخدم:*
\`.ملفات اضافه رقم اسم_الملف\`

*💡 ويـمـكـنـك الـرد عـلى رسـالـة لـجـعـل مـحـتـواهـا مـحـتـوى الـمـلـف*`);
          }

          return reply(
            await addFile(rest)
          );
        }

        case 'تعديل': {
          const spec = args[1];

          if (!spec) {
            return reply(`*❌ استخدم:*
\`.ملفات تعديل رقم\`
أو
\`.ملفات تعديل مجلد/رقم\``);
          }

          return reply(
            await editFile(spec)
          );
        }

        case 'حذف': {
          const spec = args[1];

          if (!spec) {
            return reply(`*❌ استخدم:*
\`.ملفات حذف رقم\`
أو
\`.ملفات حذف مجلد/رقم\``);
          }

          return reply(
            await deleteSpec(spec)
          );
        }

        case 'تغيير': {
          const spec = args[1];
          const newName = args.slice(2).join(' ');

          if (!spec || !newName) {
            return reply(`*❌ استخدم:*
\`.ملفات تغيير رقم الاسم_الجديد\``);
          }

          return reply(
            await renameSpec(
              spec,
              newName
            )
          );
        }

        case 'انشاء':
        case 'إنشاء':
          return reply(
            await createFolder(
              args.slice(1)
            )
          );

        case 'تحديث':
          return reply(
            await updateAll()
          );

        default:
          return reply(`*❌ الأمـر الـفـرعـي غـيـر مـعـروف*

*📋 الأوامـر:*
قائمة | فتح | عرض | اضافه | تعديل | حذف | تغيير | انشاء | تحديث`);
      }
    } catch (err) {
      console.error(
        "ملفات command error:",
        err
      );

      return reply(
        `*❌ حـدث خـطـأ أثـنـاء تـنـفـيـذ أمـر الـمـلـفـات*

⚠️ \`${err.message}\``
      );
    }
  }
};