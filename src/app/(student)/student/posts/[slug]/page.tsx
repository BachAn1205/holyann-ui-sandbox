import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StudentPageContainer } from "@/components/student";
import { Button } from "@/components/ui/button";

export default async function StudentPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await prisma.marketing_posts.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
  });

  if (!post) {
    notFound();
  }

  const publishDate = post.target_publish_date || post.created_at;

  return (
    <StudentPageContainer>
      <div className="max-w-4xl mx-auto py-6">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-3">
          <Link href="/student/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Link>
        </Button>

        <article className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {post.thumbnail_url && (
            <div className="w-full bg-muted/10 overflow-hidden relative border-b border-border flex justify-center max-h-[600px]">
              <img
                src={post.thumbnail_url}
                alt={post.title}
                className="w-full h-auto object-contain"
              />
              {post.category && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-background/90 backdrop-blur-md rounded-md text-xs font-bold text-primary uppercase tracking-wider shadow-sm">
                  {post.category}
                </div>
              )}
            </div>
          )}

          <div className="p-6 md:p-10">
            {!post.thumbnail_url && post.category && (
              <div className="mb-4 inline-block px-3 py-1 bg-primary/10 rounded-md text-xs font-bold text-primary uppercase tracking-wider">
                {post.category}
              </div>
            )}
            
            <h1 className="text-2xl md:text-4xl font-heading font-bold text-foreground mb-4">
              {post.title}
            </h1>
            
            <div className="flex items-center text-sm text-muted-foreground mb-8">
              <Calendar className="mr-2 h-4 w-4" />
              <span>
                {publishDate.toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>

            {post.excerpt && (
              <p className="text-lg text-muted-foreground font-medium mb-8 leading-relaxed border-l-4 border-primary pl-4">
                {post.excerpt}
              </p>
            )}

            <div 
              className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap prose-img:rounded-xl prose-img:shadow-sm [&_a]:text-sky-600 [&_a]:hover:text-sky-700 [&_a]:underline"
              dangerouslySetInnerHTML={{ 
                __html: post.content.split(/(<[^>]+>)/g).map(part => {
                  if (part.startsWith('<') && part.endsWith('>')) return part;
                  return part.replace(
                    /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g,
                    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-sky-600 hover:text-sky-700 underline">$1</a>'
                  );
                }).join('') 
              }}
            />

            {post.cta_link && post.cta_text && (
              <div className="mt-12 flex justify-center border-t border-border pt-8">
                <Button asChild size="lg" className="px-8 !rounded-full">
                  <a href={post.cta_link} target="_blank" rel="noopener noreferrer">
                    {post.cta_text}
                  </a>
                </Button>
              </div>
            )}
          </div>
        </article>
      </div>
    </StudentPageContainer>
  );
}
